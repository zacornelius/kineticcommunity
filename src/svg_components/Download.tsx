import * as React from 'react';
import { SVGProps } from 'react';

function SvgDownload(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="none" viewBox="0 0 24 24" {...props}>
      <path
        stroke={props.stroke || 'currentColor'}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 3v12m0 0-4-4m4 4 4-4M3 19h18"
      />
    </svg>
  );
}
export default SvgDownload;
