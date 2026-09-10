import Image from 'next/image';

interface AvatarProps {
  name: string;
  imageUrl?: string | null;
  color?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'profile';
  className?: string;
}

const sizes = {
  sm: { container: 'w-5 h-5', text: 'text-[9.5px]', px: 20 },
  md: { container: 'w-8 h-8', text: 'text-[11px]', px: 32 },
  lg: { container: 'w-12 h-12', text: 'text-[15px]', px: 48 },
  xl: { container: 'w-16 h-16', text: 'text-[20px]', px: 64 },
  '2xl': { container: 'w-24 h-24', text: 'text-[28px]', px: 96 },
  // Instagram-style profile avatar - 150px with gradient ring
  profile: { container: 'w-[150px] h-[150px]', text: 'text-[48px]', px: 150 },
};

export function Avatar({ name, imageUrl, color = '#5A2EC4', size = 'md', className = '' }: AvatarProps) {
  const initials = name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const sizeConfig = sizes[size];

  // Profile size gets Instagram-style gradient ring
  const isProfile = size === 'profile';
  const ringClass = isProfile ? 'p-[3px] bg-gradient-to-tr from-go via-heat to-go-deep rounded-full' : '';

  if (imageUrl) {
    const imageElement = (
      <span className={`${sizeConfig.container} rounded-full overflow-hidden relative flex-shrink-0 ${isProfile ? 'border-[3px] border-page' : ''}`}>
        <Image
          src={imageUrl}
          alt={name}
          width={sizeConfig.px}
          height={sizeConfig.px}
          className="w-full h-full object-cover"
          unoptimized={imageUrl.startsWith('http')}
        />
      </span>
    );

    if (isProfile) {
      return (
        <span className={`${ringClass} ${className}`}>
          {imageElement}
        </span>
      );
    }

    return <span className={className}>{imageElement}</span>;
  }

  const initialsElement = (
    <span
      className={`${sizeConfig.container} ${sizeConfig.text} rounded-full grid place-items-center font-semibold text-white font-mono flex-shrink-0 ${isProfile ? 'border-[3px] border-page' : ''}`}
      style={{ background: color }}
    >
      {initials}
    </span>
  );

  if (isProfile) {
    return (
      <span className={`${ringClass} ${className}`}>
        {initialsElement}
      </span>
    );
  }

  return <span className={className}>{initialsElement}</span>;
}
