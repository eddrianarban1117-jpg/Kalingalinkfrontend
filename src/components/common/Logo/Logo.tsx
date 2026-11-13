import logo from '../../../../logo1.png';
import whiteLogo from '../../../../whitekalinga.png';
import sidebarLogo from '../../../../logo3.png';
import styles from './Logo.module.css';

type LogoProps = {
  className?: string;
  alt?: string;
  variant?: 'sidebar' | 'lightSidebar' | 'adminSidebar' | 'login' | 'default';
};

export function Logo({
  className = '',
  alt = 'KalingaLink',
  variant = 'default',
}: LogoProps) {
  if (
    variant === 'sidebar' ||
    variant === 'lightSidebar' ||
    variant === 'adminSidebar'
  ) {
    return (
      <img
        alt={alt}
        className={`${styles.logo} ${styles.sidebar} ${className}`.trim()}
        src={sidebarLogo}
      />
    );
  }

  return (
    <img
      alt={alt}
      className={`${styles.logo} ${styles[variant]} ${className}`.trim()}
      src={variant === 'default' ? logo : whiteLogo}
    />
  );
}
