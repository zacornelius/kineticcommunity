# Video Transcoding Setup with AWS MediaConvert

This document explains how video transcoding works in the application and how to complete the setup.

## Overview

When users upload videos (including `.mov` files from mobile), the system:

1. **Uploads the original** to S3 in the `original/` folder
2. **Triggers MediaConvert** to transcode to `.mp4` format
3. **Stores the transcoded file** in the root of the S3 bucket
4. **Shows processing status** to users while transcoding happens
5. **Updates status** when complete (via webhook or polling)

## Current Status

✅ **Completed:**
- MediaConvert IAM role created (`MediaConvertRole`)
- Database schema updated with `processingStatus` and `originalFileName` fields
- Upload flow triggers MediaConvert jobs automatically
- UI shows "Processing video..." spinner while transcoding
- API endpoint created to update status when complete

⚠️ **Needs Manual Setup:**
- EventBridge rule to call our API when MediaConvert jobs complete
- OR implement polling to check job status

## Option 1: EventBridge Webhook (Recommended)

This automatically updates video status when MediaConvert finishes.

### Steps:

1. **Create EventBridge Rule:**
```bash
aws events put-rule \
  --name mediaconvert-job-complete \
  --event-pattern '{
    "source": ["aws.mediaconvert"],
    "detail-type": ["MediaConvert Job State Change"],
    "detail": {
      "status": ["COMPLETE", "ERROR"]
    }
  }' \
  --region us-east-2
```

2. **Add API Gateway as Target:**

First, create an API Gateway HTTP endpoint that forwards to your ECS service:
- Go to API Gateway console
- Create HTTP API
- Add route: `POST /api/video/transcode-complete`
- Integration: HTTP proxy to your ALB
- Note the API Gateway endpoint URL

3. **Add Target to EventBridge Rule:**
```bash
aws events put-targets \
  --rule mediaconvert-job-complete \
  --targets "Id"="1","Arn"="<your-api-gateway-arn>","HttpParameters"={"HeaderParameters"={"X-Event-Source"="eventbridge"}} \
  --region us-east-2
```

4. **Update the transcoding function** to include metadata:

In `src/lib/video/transcodeVideo.ts`, add to the job settings:
```typescript
UserMetadata: {
  fileName: outputFileName,
},
```

5. **Update the webhook handler** to parse EventBridge events:

In `src/app/api/video/transcode-complete/route.ts`, update the POST handler:
```typescript
const body = await request.json();

// Check if this is from EventBridge
if (body.source === 'aws.mediaconvert') {
  const { status, userMetadata } = body.detail;
  const fileName = userMetadata?.fileName;
  
  if (!fileName) {
    return NextResponse.json({ error: 'fileName not found in metadata' }, { status: 400 });
  }
  
  // ... rest of the update logic
}
```

## Option 2: Client-Side Polling (Simpler, Less Efficient)

If you don't want to set up EventBridge, you can poll for status updates.

### Implementation:

1. **Add polling to the Posts component:**

In `src/components/Posts.tsx` or wherever videos are displayed:

```typescript
useEffect(() => {
  // Find any videos that are processing
  const processingVideos = posts
    .flatMap(post => post.visualMedia)
    .filter(media => 
      media.type === 'VIDEO' && 
      (media.processingStatus === 'PROCESSING' || media.processingStatus === 'PENDING')
    );

  if (processingVideos.length === 0) return;

  // Poll every 30 seconds
  const interval = setInterval(async () => {
    for (const video of processingVideos) {
      const fileName = video.url.split('/').pop();
      const response = await fetch(`/api/video/transcode-complete?fileName=${fileName}`);
      const data = await response.json();
      
      if (data.processingStatus === 'COMPLETED' || data.processingStatus === 'FAILED') {
        // Refetch posts to update UI
        queryClient.invalidateQueries(['posts']);
        break;
      }
    }
  }, 30000);

  return () => clearInterval(interval);
}, [posts]);
```

## Option 3: Manual Status Check (For Testing)

You can manually check and update video status:

```bash
# Check status
curl "https://your-domain.com/api/video/transcode-complete?fileName=1234567890-abc.mp4"

# Manually mark as complete
curl -X POST "https://your-domain.com/api/video/transcode-complete" \
  -H "Content-Type: application/json" \
  -d '{"fileName": "1234567890-abc", "status": "COMPLETE"}'
```

## Testing the Flow

1. **Upload a .mov video** from the app
2. **Check S3** - you should see:
   - `original/1234567890-abc.mov` (original file)
3. **Check MediaConvert console** - you should see a job running
4. **In the app** - video should show "Processing video..." spinner
5. **After ~1-5 minutes** - check S3 again:
   - `1234567890-abc.mp4` (transcoded file)
6. **Update status** (via EventBridge, polling, or manual API call)
7. **Refresh app** - video should now play

## Troubleshooting

### Video stuck in "Processing" state
- Check MediaConvert console for job status
- Check CloudWatch logs for MediaConvert errors
- Manually update status via API to test

### MediaConvert job fails
- Check IAM role has S3 permissions
- Check input file exists in S3
- Check MediaConvert CloudWatch logs

### Original file not deleted
- This is by design (Option C: Only Transcoded)
- Original files are kept in `original/` folder for backup
- You can manually delete them or set up S3 lifecycle rules

## Cost Optimization

MediaConvert pricing:
- ~$0.015 per minute of video (basic tier)
- A 1-minute video costs ~$0.015
- 1000 videos/month = ~$15

To reduce costs:
- Set up S3 lifecycle rules to delete `original/` files after 30 days
- Use MediaConvert reserved pricing for high volume
- Consider client-side transcoding for very high volume

## Next Steps

Choose one of the options above and implement it. Option 1 (EventBridge) is recommended for production as it's the most efficient and provides real-time updates.

