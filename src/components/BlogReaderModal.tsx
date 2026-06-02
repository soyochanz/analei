/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Calendar, Clock, BookOpen, Share2, Heart } from 'lucide-react';
import { Article } from '../types';

interface BlogReaderModalProps {
  article: Article | null;
  onClose: () => void;
}

export default function BlogReaderModal({ article, onClose }: BlogReaderModalProps) {
  const [isLiked, setIsLiked] = React.useState(false);

  return (
    <AnimatePresence>
      {article && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            id="blog-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-stone-950/40 backdrop-blur-md"
          />

          {/* Modal Panel */}
          <motion.div
            id="blog-reader-card"
            initial={{ scale: 0.95, y: 30, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.95, y: 30, opacity: 0 }}
            className="relative w-full max-w-2xl bg-[#fffbfb] backdrop-blur-2xl rounded-2xl shadow-2xl overflow-hidden border border-rose-100 z-10 max-h-[90vh] flex flex-col text-stone-800"
          >
            {/* Image Banner */}
            <div className="relative h-60 w-full sm:h-72 overflow-hidden bg-rose-50">
              <img
                src={article.image}
                alt={article.title}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-stone-950/70 via-stone-950/20 to-transparent" />
              
              {/* Category chip */}
              <span className="absolute top-4 left-4 bg-[#da4d73] text-white text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">
                {article.category}
              </span>

              {/* Close Button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 bg-stone-950/55 text-white hover:bg-stone-950/75 border border-white/10 p-2 rounded-full transition-colors cursor-pointer"
                title="Cerrar artículo"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Bottom titles inside gradient */}
              <div className="absolute bottom-6 left-6 right-6 text-white text-balance">
                <span className="text-[11px] text-pink-200 flex items-center gap-2 mb-2 font-mono uppercase font-semibold">
                  <Calendar className="w-3.5 h-3.5" /> {article.publishedDate} &bull; <Clock className="w-3.5 h-3.5" /> {article.readTime}
                </span>
                <h3 className="font-serif text-lg sm:text-2xl font-bold leading-tight">
                  {article.title}
                </h3>
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="p-6 sm:p-8 overflow-y-auto flex-1 bg-[#fffbfb] text-stone-750">
              {/* Summary italic panel */}
              <p className="font-sans italic text-stone-600 border-l-4 border-[#da4d73] pl-4 py-1 mb-6 text-sm">
                "{article.summary}"
              </p>

              {/* Actual Markdown/HTML split text content */}
              <div className="space-y-4 text-xs sm:text-sm leading-relaxed text-stone-600 font-sans whitespace-pre-wrap">
                {article.content}
              </div>

              {/* Heart and share action bottom bar */}
              <div className="mt-8 pt-6 border-t border-rose-100 flex justify-between items-center bg-rose-50/40 border border-rose-100/50 p-4 rounded-xl">
                <div className="flex gap-3">
                  <button
                    onClick={() => setIsLiked(!isLiked)}
                    className={`flex items-center gap-2 text-xs font-bold transition-colors px-3 py-1.5 rounded-full cursor-pointer border ${
                      isLiked 
                        ? 'bg-rose-100 text-[#da4d73] border-rose-200' 
                        : 'bg-white border border-rose-150 hover:bg-rose-50 text-stone-600'
                    }`}
                  >
                    <Heart className={`w-4 h-4 ${isLiked ? 'fill-[#da4d73] text-[#da4d73]' : ''}`} />
                    {isLiked ? 'Me gusta' : 'Dar Me Gusta'}
                  </button>

                  <button
                    onClick={() => alert(`Enlace copiado de: "${article.title}"`)}
                    className="flex items-center gap-2 text-xs font-bold bg-white border border-rose-150 text-stone-600 px-3 py-1.5 rounded-full hover:bg-rose-50 transition-colors cursor-pointer"
                  >
                    <Share2 className="w-4 h-4 text-stone-600" />
                    Compartir
                  </button>
                </div>

                <div className="hidden sm:flex text-xs text-stone-500 items-center gap-1.5 font-semibold">
                  <BookOpen className="w-4 h-4 text-[#da4d73]" />
                  <span>Espacio de Lectura María</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
