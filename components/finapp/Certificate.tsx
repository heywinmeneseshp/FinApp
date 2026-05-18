'use client';

import React, { useRef } from 'react';
import { motion } from 'motion/react';
import { Download, Share2, Award, Calendar, BadgeCheck, X } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface CertificateProps {
  userName: string;
  moduleTitle: string;
  date: string;
  onClose: () => void;
}

export default function Certificate({ userName, moduleTitle, date, onClose }: CertificateProps) {
  const certificateRef = useRef<HTMLDivElement>(null);
  const [isMounted, setIsMounted] = React.useState(false);
  const [certId, setCertId] = React.useState('');

  React.useEffect(() => {
    setIsMounted(true);
    setCertId(`FIN-2026-${(Math.random() * 1000).toFixed(0).padStart(4, '0')}`);
  }, []);

  const downloadPDF = async () => {
    if (!certificateRef.current) return;
    
    const canvas = await html2canvas(certificateRef.current, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff'
    });
    
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'px',
      format: [canvas.width, canvas.height]
    });
    
    pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
    pdf.save(`Certificado_FinApp_${userName.replace(/\s+/g, '_')}.pdf`);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-[#151619]/90 backdrop-blur-md flex items-center justify-center p-4 sm:p-8"
    >
      <div className="max-w-4xl w-full flex flex-col gap-6">
        <div className="flex justify-between items-center text-white">
          <div className="flex items-center gap-2">
            <Award className="text-[#12C2A2]" />
            <h2 className="text-xl font-bold">Tu Certificado Oficial</h2>
          </div>
          <button onClick={onClose} className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Certificate Canvas */}
        <div className="bg-white rounded-3xl p-1 shadow-2xl overflow-hidden aspect-[1.414/1] w-full">
          <div 
            ref={certificateRef}
            className="w-full h-full bg-white relative p-12 flex flex-col items-center justify-between border-[12px] border-double border-zinc-50 rounded-[inherit]"
            style={{ 
              backgroundImage: 'radial-gradient(circle at 0% 0%, rgba(18, 194, 162, 0.05) 0%, transparent 50%), radial-gradient(circle at 100% 100%, rgba(48, 104, 229, 0.05) 0%, transparent 50%)' 
            }}
          >
            {/* Corner Accents */}
            <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-[#3068E5] to-[#12C2A2] opacity-10 rounded-br-[100%]" />
            <div className="absolute bottom-0 right-0 w-32 h-32 bg-gradient-to-tl from-[#12C2A2] to-[#3068E5] opacity-10 rounded-tl-[100%]" />

            {/* Logo */}
            <div className="text-3xl font-bold">
              <span className="text-[#151619]">Fin</span>
              <span className="text-[#12C2A2]">App</span>
            </div>

            <div className="text-center space-y-6 z-10 w-full">
              <div className="space-y-1">
                <h3 className="text-4xl font-extrabold text-[#151619] tracking-tight uppercase">
                  Certificado de Finalización
                </h3>
                <div className="w-24 h-1 bg-[#12C2A2] mx-auto rounded-full" />
              </div>

              <div className="space-y-2">
                <p className="text-zinc-400 font-medium italic">Se otorga el presente certificado a</p>
                <h1 className="text-5xl font-black text-[#3068E5] tracking-tight px-4 break-words">
                  {userName}
                </h1>
                <p className="text-zinc-500 font-medium max-w-lg mx-auto">
                  por completar satisfactoriamente el programa de aprendizaje de FinApp
                </p>
              </div>

              <div className="flex items-center justify-center gap-4 py-4">
                <span className="text-2xl text-[#12C2A2]">🌿</span>
                <h2 className="text-3xl font-bold text-[#151619] border-b-2 border-zinc-100 pb-1">
                  {moduleTitle}
                </h2>
                <span className="text-2xl text-[#12C2A2]">🌿</span>
              </div>

              <p className="text-zinc-400 text-sm max-w-md mx-auto leading-relaxed">
                Demostrando compromiso con el aprendizaje y la gestión financiera de su negocio.
              </p>
            </div>

            {/* Metadata and Signatures */}
            <div className="w-full flex justify-between items-end mt-8 z-10">
              <div className="flex flex-col gap-4 text-left">
                <div className="flex items-center gap-3 bg-zinc-50 px-4 py-2 rounded-xl">
                  <Calendar size={16} className="text-[#12C2A2]" />
                  <div>
                    <p className="text-[10px] text-zinc-400 uppercase font-bold leading-none">Fecha</p>
                    <p className="text-sm font-bold text-[#151619]">{date}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 bg-zinc-50 px-4 py-2 rounded-xl">
                  <BadgeCheck size={16} className="text-[#3068E5]" />
                  <div>
                    <p className="text-[10px] text-zinc-400 uppercase font-bold leading-none">ID Certificado</p>
                    <p className="text-sm font-bold text-[#151619]">{certId}</p>
                  </div>
                </div>
              </div>

              {/* Seal */}
              <div className="relative">
                <div className="w-24 h-24 bg-gradient-to-br from-[#12C2A2] to-[#3068E5] rounded-full flex items-center justify-center shadow-xl border-4 border-white">
                  <Award size={48} className="text-white" />
                </div>
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap bg-[#151619] text-white text-[8px] font-bold px-3 py-1 rounded-full border border-white/20">
                  CERTIFICADO OFICIAL
                </div>
              </div>

              <div className="flex flex-col items-center gap-2">
                <div className="w-40 h-px bg-zinc-200" />
                <p className="text-xs font-bold text-[#151619]">Equipo FinApp</p>
                <p className="text-[8px] text-zinc-400 uppercase tracking-widest">Director del Programa</p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-4">
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={downloadPDF}
            className="flex-1 py-4 bg-[#12C2A2] text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-xl shadow-[#12C2A2]/20"
          >
            <Download size={20} />
            Descargar PDF
          </motion.button>
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex-1 py-4 bg-white text-[#151619] rounded-2xl font-bold flex items-center justify-center gap-2 shadow-xl"
          >
            <Share2 size={20} />
            Compartir Logro
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
