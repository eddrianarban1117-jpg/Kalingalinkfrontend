import logo from '../../../../logo1.png';
import whiteLogo from '../../../../whitekalinga.png';
import skyBlueLogo from '../../../../skybluekalinga.png';
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
  if (variant === 'lightSidebar') {
    return (
      <img
        alt={alt}
        className={`${styles.logo} ${styles.lightSidebar} ${className}`.trim()}
        src={skyBlueLogo}
      />
    );
  }

  if (variant === 'adminSidebar') {
    return (
      <span aria-label={alt} className={`${styles.adminSidebar} ${className}`.trim()} role="img">
        <img alt="" className={styles.adminLightLogo} src={skyBlueLogo} />
        <img alt="" className={styles.adminDarkLogo} src={whiteLogo} />
      </span>
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
