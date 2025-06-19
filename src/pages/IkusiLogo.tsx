import React from 'react';

import logoUrl from '../assets/ikusi-logo.png';

export function IkusiLogo(props: React.ImgHTMLAttributes<HTMLImageElement>) {
  return <img src={logoUrl} alt="Ikusi Logo" {...props} />;
}
