import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/common/Button/Button';
import {
  logoAltText,
  routePaths,
  welcomeButtonLabel,
} from '../../constants/app-constants';
import logo from '../../assets/images/logo.png';
import styles from './Welcome.module.css';

export function Welcome() {
  const navigate = useNavigate();

  return (
    <main className={styles.page}>
      <div className={styles.content}>
        <img className={styles.logo} src={logo} alt={logoAltText} />
        <Button
          type="button"
          onClick={() => navigate(routePaths.accountChoice)}
        >
          {welcomeButtonLabel}
        </Button>
      </div>
    </main>
  );
}
