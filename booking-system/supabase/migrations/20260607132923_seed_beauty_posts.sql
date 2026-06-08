insert into public.blog_posts (
  title,
  category,
  read_time,
  summary,
  content_html,
  cover_image_url,
  is_published,
  published_date
) values
(
  '5 Pasos Esenciales para una Piel Radiante y Luminosa',
  'Skincare',
  '3 min de lectura',
  'Descubre los pasos clave que recomiendan los dermatologos para conseguir un rostro jugoso, revitalizado y lleno de luz de manera natural.',
  '<p>Lograr un rostro saludable e iluminado no requiere una rutina interminable. Los especialistas coinciden en que priorizar estos pasos fundamentales produce beneficios inmediatos y duraderos.</p><p><strong>1. Limpieza respetuosa:</strong> limpia tu rostro eliminando residuos sin arrastrar la barrera lipidica protectora.</p><p><strong>2. Capas de hidratacion:</strong> usa ingredientes capaces de retener agua, como aloe vera o glicerina botanica.</p><p><strong>3. Tratamiento focalizado:</strong> aplica serums especificos para imperfecciones, manchas o falta de elasticidad.</p><p><strong>4. Sellado:</strong> aplica una crema o aceite seco vegetal para evitar la deshidratacion.</p><p><strong>5. Proteccion solar diaria:</strong> la radiacion UV es el mayor causante de envejecimiento y manchas.</p>',
  'https://images.unsplash.com/photo-1556228720-195a672e8a03?q=80&w=600&auto=format&fit=crop',
  true,
  '2026-06-02'
),
(
  'Como Elegir el Serum Perfecto para tu Tipo de Piel',
  'Skincare',
  '4 min de lectura',
  'Las moleculas activas pueden abrumarte. Aqui tienes una guia clara para elegir el serum que tu piel realmente necesita para brillar.',
  '<p>Los serums contienen una concentracion alta de principios activos. Elegir la combinacion adecuada depende del objetivo prioritario de tu piel.</p><p><strong>Lineas finas y textura desigual:</strong> busca formulas con retinol o bakuchiol.</p><p><strong>Manchas y falta de luminosidad:</strong> vitamina C o niacinamida ayudan a neutralizar el estres oxidativo.</p><p><strong>Deshidratacion intensa:</strong> el acido hialuronico restaura volumen y jugosidad.</p><p><strong>Piel reactiva:</strong> centella asiatica y pantenol ayudan a calmar la inflamacion.</p>',
  'https://images.unsplash.com/photo-1608248597481-496100c8c836?q=80&w=600&auto=format&fit=crop',
  true,
  '2026-05-28'
),
(
  'Rutina Nocturna para un Rostro Despierto y Despejado',
  'Skincare',
  '3 min de lectura',
  'Aprende a sincronizar tus productos cosmeticos con el ciclo de regeneracion celular nocturno de tu propio cuerpo.',
  '<p>Mientras descansas, la piel activa sus mecanismos de regeneracion. Sincronizar tus aplicaciones con este ciclo optimiza los resultados.</p><p><strong>Doble limpieza:</strong> retira primero maquillaje y grasa, despues purifica con un limpiador acuoso suave.</p><p><strong>Exfoliacion suave:</strong> usa exfoliante quimico suave dos noches por semana.</p><p><strong>Nutricion activa:</strong> aplica productos ricos en peptidos y antioxidantes.</p><p><strong>Cierre de barrera:</strong> termina con una crema rica en ceramidas para evitar la deshidratacion.</p>',
  'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?q=80&w=600&auto=format&fit=crop',
  true,
  '2026-05-24'
),
(
  'Pinceles y Brochas 101: Usos y Beneficios Esenciales',
  'Maquillaje',
  '2 min de lectura',
  'La linea que separa un acabado amateur de uno profesional esta en el diseno y la densidad de tus pinceles.',
  '<p>Usar herramientas adecuadas optimiza el producto y fusiona los pigmentos con suavidad.</p><p><strong>Brocha de polvos:</strong> fibras grandes y aireadas para un efecto ligero.</p><p><strong>Brocha de base:</strong> fibras densas para extender cremas fluidas sin absorber producto en exceso.</p><p><strong>Brocha difuminadora:</strong> cerdas finas que degradan sombras de ojos.</p><p><strong>Pincel biselado:</strong> ideal para trazos simetricos con eyeliner. Lava tus brochas semanalmente con jabon neutro.</p>',
  'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?q=80&w=600&auto=format&fit=crop',
  true,
  '2026-05-20'
)
on conflict do nothing;
