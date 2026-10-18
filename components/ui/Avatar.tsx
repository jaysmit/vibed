import Image from 'next/image';

interface AvatarProps {
  name: string;
  imageUrl?: string | null;
  color?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | 'profile';
  className?: string;
}

const sizes = {
  sm: { px: 20, text: 'text-[9.5px]' },
  md: { px: 32, text: 'text-[11px]' },
  lg: { px: 40, text: 'text-[13px]' },
  xl: { px: 48, text: 'text-[15px]' },
  '2xl': { px: 56, text: 'text-[18px]' },
  '3xl': { px: 80, text: 'text-[24px]' },
  profile: { px: 80, text: 'text-[24px]' },
};

export function Avatar({ name, imageUrl, color = '#5A2EC4', size = 'md', className = '' }: AvatarProps) {
  const initials = name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const sizeConfig = sizes[size];
  const isProfile = size === 'profile';

  // Profile size: 48px image + 3px white border + 3px gradient = 54px total
  const profileOuterSize = sizeConfig.px + 12;

  if (imageUrl) {
    if (isProfile) {
      return (
        <span
          data-avatar="avatar-profile"
          className={`inline-flex items-center justify-center rounded-full bg-gradient-to-tr from-go via-heat to-go-deep flex-shrink-0 ${className}`}
          style={{ width: profileOuterSize, height: profileOuterSize }}
        >
          <Image
            src={imageUrl}
            alt={name}
            width={sizeConfig.px}
            height={sizeConfig.px}
            style={{ width: sizeConfig.px, height: sizeConfig.px }}
            className="rounded-full object-cover border-[3px] border-page"
            unoptimized={imageUrl.startsWith('http')}
          />
        </span>
      );
    }

    return (
      <Image
        data-avatar={`avatar-${size}`}
        src={imageUrl}
        alt={name}
        width={sizeConfig.px}
        height={sizeConfig.px}
        style={{ width: sizeConfig.px, height: sizeConfig.px, minWidth: sizeConfig.px }}
        className={`rounded-full object-cover flex-shrink-0 ${className}`}
        unoptimized={imageUrl.startsWith('http')}
      />
    );
  }

  // Initials fallback
  if (isProfile) {
    return (
      <span
        data-avatar="avatar-profile"
        className={`inline-flex items-center justify-center rounded-full bg-gradient-to-tr from-go via-heat to-go-deep flex-shrink-0 ${className}`}
        style={{ width: profileOuterSize, height: profileOuterSize }}
      >
        <span
          className={`${sizeConfig.text} rounded-full grid place-items-center font-semibold text-white font-mono border-[3px] border-page`}
          style={{ background: color, width: sizeConfig.px, height: sizeConfig.px }}
        >
          {initials}
        </span>
      </span>
    );
  }

  return (
    <span
      data-avatar={`avatar-${size}`}
      className={`${sizeConfig.text} rounded-full grid place-items-center font-semibold text-white font-mono flex-shrink-0 ${className}`}
      style={{ background: color, width: sizeConfig.px, height: sizeConfig.px, minWidth: sizeConfig.px }}
    >
      {initials}
    </span>
  );
}
