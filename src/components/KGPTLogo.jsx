import logoUrl from '../assets/kgpt-icons/android-chrome-192x192.png';

const KGPTLogo = ({ className = '', alt = 'KrishnaGPT logo' }) => {
  const classes = ['kgpt-logo', className].filter(Boolean).join(' ');

  return <img src={logoUrl} alt={alt} className={classes} />;
};

export default KGPTLogo;

