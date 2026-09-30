import type { SVGProps } from 'react';

/**
 * La carita de Fetita, del kit de marca. Lleva sus propios colores: no toma
 * el color del texto como los íconos de lucide. Sin ids ni clips, así puede
 * repetirse en la página sin chocar.
 */
export function FetitaIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" {...props}>
      <rect width="36" height="36" rx="9" fill="#F2C346" />
      <circle cx="9" cy="10.5" r="3" fill="#121224" />
      <circle cx="27" cy="10.5" r="3" fill="#121224" />
      <ellipse opacity="0.5" cx="5.25" cy="15.75" rx="3.75" ry="2.25" fill="#FF8A65" />
      <ellipse opacity="0.5" cx="30.75" cy="15.75" rx="3.75" ry="2.25" fill="#FF8A65" />
      <path
        d="M17.0001 20C17.0001 20 17.3751 20.5001 18.0002 20.5001C18.6252 20.5001 19.0003 20 19.0003 20M17.2501 18.7499H17.2526M18.7503 18.7499H18.7528M20.5004 19.5C20.5004 20.8808 19.381 22.0002 18.0002 22.0002C16.6194 22.0002 15.5 20.8808 15.5 19.5C15.5 18.1192 16.6194 16.9998 18.0002 16.9998C19.381 16.9998 20.5004 18.1192 20.5004 19.5Z"
        stroke="#121224"
        strokeWidth="2.25"
        strokeLinecap="round"
      />
    </svg>
  );
}
