import Image from 'next/image';

export default function Navbar() {
  return (
    <div className="flex w-full flex-row bg-white px-8 py-4 drop-shadow">
      <Image
        src="/logo.png"
        alt="Logo"
        width={327}
        height={39}
        className="h-4 w-auto"
        style={{ objectFit: 'contain' }}
      />
    </div>
  );
}
