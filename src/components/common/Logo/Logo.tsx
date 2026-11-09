import logo from '../../../../logo1.png';
import whiteLogo from '../../../../whitekalinga.png';
import styles from './Logo.module.css';

type LogoProps = {
  className?: string;
  alt?: string;
  variant?: 'sidebar' | 'login' | 'default';
};

export function Logo({
  className = '',
  alt = 'KalingaLink',
  variant = 'default',
}: LogoProps) {
  return (
    <img
      alt={alt}
      className={`${styles.logo} ${styles[variant]} ${className}`.trim()}
      src={variant === 'default' ? logo : whiteLogo}
    />
  );
}
