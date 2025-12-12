import 'server-only';
import { MediaConvertClient, CreateJobCommand } from '@aws-sdk/client-mediaconvert';

const mediaConvertClient = new MediaConvertClient({
  region: process.env.AWS_REGION || 'us-east-2',
  endpoint: 'https://mediaconvert.us-east-2.amazonaws.com',
});

const MEDIA_CONVERT_ROLE_ARN = 'arn:aws:iam::885629328744:role/MediaConvertRole';
const S3_BUCKET = process.env.S3_BUCKET_NAME || 'kinetic-community';

interface TranscodeVideoParams {
  inputFileName: string; // e.g., "original/video.mov"
  outputFileName: string; // e.g., "video" (without extension)
}

export async function transcodeVideo({ inputFileName, outputFileName }: TranscodeVideoParams) {
  const inputS3Path = `s3://${S3_BUCKET}/${inputFileName}`;
  // Destination must be a directory (ending with /)
  const outputS3Directory = `s3://${S3_BUCKET}/`;
  // Extract just the base name without extension for the output
  const baseNameWithoutExt = outputFileName.replace(/\.[^/.]+$/, '');

  const jobSettings = {
    Role: MEDIA_CONVERT_ROLE_ARN,
    Settings: {
      Inputs: [
        {
          FileInput: inputS3Path,
          AudioSelectors: {
            'Audio Selector 1': {
              DefaultSelection: 'DEFAULT',
            },
          },
          VideoSelector: {
            Rotate: 'AUTO', // Automatically detect and apply rotation from metadata
          },
        },
      ],
      OutputGroups: [
        {
          Name: 'File Group',
          OutputGroupSettings: {
            Type: 'FILE_GROUP_SETTINGS',
            FileGroupSettings: {
              Destination: `${outputS3Directory}${baseNameWithoutExt}`,
              DestinationSettings: {
                S3Settings: {
                  StorageClass: 'STANDARD',
                },
              },
            },
          },
          Outputs: [
            {
              ContainerSettings: {
                Container: 'MP4',
                Mp4Settings: {},
              },
              VideoDescription: {
                CodecSettings: {
                  Codec: 'H_264',
                  H264Settings: {
                    MaxBitrate: 5000000, // 5 Mbps
                    RateControlMode: 'QVBR',
                    QualityTuningLevel: 'SINGLE_PASS_HQ',
                  },
                },
                // Remove fixed Width/Height to preserve aspect ratio and orientation
                // MediaConvert will automatically maintain the original aspect ratio
                ScalingBehavior: 'DEFAULT',
              },
              AudioDescriptions: [
                {
                  CodecSettings: {
                    Codec: 'AAC',
                    AacSettings: {
                      Bitrate: 128000,
                      CodingMode: 'CODING_MODE_2_0',
                      SampleRate: 48000,
                    },
                  },
                },
              ],
            },
          ],
        },
      ],
    },
    StatusUpdateInterval: 'SECONDS_60',
  };

  try {
    const command = new CreateJobCommand(jobSettings);
    const response = await mediaConvertClient.send(command);
    
    console.log('MediaConvert job created:', response.Job?.Id);
    
    return {
      jobId: response.Job?.Id,
      status: response.Job?.Status,
    };
  } catch (error) {
    console.error('Failed to create MediaConvert job:', error);
    throw error;
  }
}

