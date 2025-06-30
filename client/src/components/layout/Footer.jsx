import { Container, Row, Col } from 'react-bootstrap';
import githubIcon from '../../assets/icons/github-mark.svg';
import styles from './Footer.module.css';

const Footer = () => {
  return (
    <footer className={styles.footer}>
      <Container>
        <Row>
          <Col>
            <div className={styles.footerContent}>
              <div className={styles.footerLinks}>
                <a 
                  href="https://github.com/itsPinguiz" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className={styles.footerLink}
                >
                  <img 
                    src={githubIcon} 
                    alt="GitHub" 
                    className={styles.githubIcon}
                  />
                  Repository GitHub
                </a>
                
                <a 
                  href="https://elite.polito.it/teaching/01udf-aw1" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className={styles.footerLink}
                >
                  Corso Applicazioni Web I
                </a>
                
                <a 
                  href="https://docs.google.com/document/d/1M33wjx0DTgZSIBhdLQc1-jQdQ6znLe7BbjRz0w3FLe0" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className={styles.footerLink}
                >
                  Specifica d'Esame
                </a>
              </div>
              
              <div className={styles.footerCredit}>
                <span>Sviluppato da Stefano Zizzi - s346595</span>
              </div>
            </div>
          </Col>
        </Row>
      </Container>
    </footer>
  );
};

export default Footer;
