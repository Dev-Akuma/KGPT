import logoUrl from '../assets/1_svg.svg';

const KGPTLogo = ({ className = '', alt = 'KrishnaGPT logo' }) => {
  const classes = ['kgpt-logo', className].filter(Boolean).join(' ');

  return <img src={logoUrl} alt={alt} className={classes} />;
};

export default KGPTLogo;
