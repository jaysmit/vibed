import Image from 'next/image';

interface AvatarProps {
  name: string;
  imageUrl?: string | null;
  color?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
}

const sizes = {
  sm: { container: 'w-5 h-5', text: 'text-[9.5px]', px: 20 },
  md: { container: 'w-8 h-8', text: 'text-[11px]', px: 32 },
  lg: { container: 'w-12 h-12', text: 'text-[15px]', px: 48 },
  xl: { container: 'w-16 h-16', text: 'text-[20px]', px: 64 },
  '2xl': { container: 'w-24 h-24', text: 'text-[28px]', px: 96 },
};

export function Avatar({ name, imageUrl, color = '#5A2EC4', size = 'md', className = '' }: AvatarProps) {
  const initials = name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const sizeConfig = sizes[size];

  if (imageUrl) {
    return (
      <span className={`${sizeConfig.container} rounded-full overflow-hidden relative flex-shrink-0 ${className}`}>
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
  }

  return (
    <span
      className={`${sizeConfig.container} ${sizeConfig.text} rounded-full grid place-items-center font-semibold text-white font-mono flex-shrink-0 ${className}`}
      style={{ background: color }}
    >
      {initials}
    </span>
  );
}
