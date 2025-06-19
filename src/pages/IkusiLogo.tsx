import logoUrl from '../assets/ikusi-logo.png';
import React from 'react';

export function IkusiLogo(props: React.ImgHTMLAttributes<HTMLImageElement>) {
  return <img src={logoUrl} alt="Ikusi Logo" {...props} />;
}
