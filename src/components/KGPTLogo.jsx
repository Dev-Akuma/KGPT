import logoUrl from '../assets/compass-icons/Plain Logo.svg';

const KGPTLogo = ({ className = '', alt = 'The Compass logo' }) => {
  const classes = ['kgpt-logo', className].filter(Boolean).join(' ');

  return <img src={logoUrl} alt={alt} className={classes} />;
};

export default KGPTLogo;

