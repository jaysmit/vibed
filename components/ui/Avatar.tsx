interface AvatarProps {
  name: string;
  color?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizes = {
  sm: 'w-5 h-5 text-[9.5px]',
  md: 'w-8 h-8 text-[11px]',
  lg: 'w-12 h-12 text-[15px]',
};

export function Avatar({ name, color = '#5A2EC4', size = 'md', className = '' }: AvatarProps) {
  const initials = name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <span
      className={`${sizes[size]} rounded-full grid place-items-center font-semibold text-white font-mono ${className}`}
      style={{ background: color }}
    >
      {initials}
    </span>
  );
}
