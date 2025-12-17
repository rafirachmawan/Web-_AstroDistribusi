// ================= src/components/hrd/InputBlack.tsx =================
// Utility wrapper untuk memastikan text & placeholder input berwarna hitam
export default function InputBlack({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="input-black">
      {children}
      <style jsx global>{`
        .input-black input,
        .input-black select,
        .input-black textarea {
          color: #000;
        }
        .input-black input::placeholder,
        .input-black textarea::placeholder {
          color: #000;
          opacity: 0.6;
        }
      `}</style>
    </div>
  );
}
