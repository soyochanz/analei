import React from 'react';

interface LogoAnaleiProps {
  className?: string;
  textClass?: string;
  showSubtext?: boolean;
}

export default function LogoAnalei({
  className = "flex items-center"
}: LogoAnaleiProps) {
  const logoUrl = 'https://zuhiuvreazpkpwkealfm.supabase.co/storage/v1/object/public/11/logo2.png';

  return (
    <div className={`relative select-none ${className}`}>
      <img
        src={logoUrl}
        alt="Analei"
        className="h-16 w-auto object-contain sm:h-20"
        referrerPolicy="no-referrer"
      />
    </div>
  );
}
