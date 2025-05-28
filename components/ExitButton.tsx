import Link from 'next/link';

const ExitButton = () => {
  return (
    <Link 
      href="/"
      className="fixed top-[15px] left-4 z-50 border border-[#FFB74D] bg-[rgba(20,20,25,0.7)] backdrop-blur-sm rounded-lg shadow-lg text-[#E0E0E0] hover:text-[#FFB74D] px-4 py-2 text-sm font-bold tracking-wide transition-colors duration-200"
      style={{ height: '40px', display: 'flex', alignItems: 'center' }}
    >
      ← Exit
    </Link>
  );
};

export default ExitButton; 