export interface Lesson {
  id: string;
  title: string;
  description: string;
  category: string;
  status: 'completed' | 'in-progress' | 'blocked';
  progress: number;
  content: {
    type: 'text' | 'diagram' | 'example' | 'tip';
    value: string | any;
  }[];
  quiz?: {
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  }[];
}

export interface Module {
  id: string;
  title: string;
  lessons: Lesson[];
}

export const learningModules: Module[] = [
  {
    id: 'finanzas-basicas',
    title: 'Finanzas de tu Negocio',
    lessons: [
      {
        id: 'balance-general',
        title: 'Balance general',
        description: 'La base de todo: Activos, Pasivos y Patrimonio.',
        category: 'Contabilidad',
        status: 'completed',
        progress: 100,
        content: [
          { type: 'text', value: 'El Balance General es como el "check-up" médico de tu empresa. Te dice qué tienes y qué debes en un momento exacto.' },
          { type: 'tip', value: 'Activo = Pasivo + Patrimonio. Esta es la ecuación fundamental que siempre debe cuadrar.' },
          { type: 'example', value: 'Si tienes $5,000 en el banco (Activo) y debes $2,000 a un proveedor (Pasivo), tu Patrimonio real es de $3,000.' }
        ],
        quiz: [
          {
            question: '¿Qué sucede si compras mercancía al contado por $500?',
            options: [
              'Tus Activos totales aumentan',
              'Tus Activos cambian de forma (menos efectivo, más inventario)',
              'Tus Pasivos aumentan'
            ],
            correctIndex: 1,
            explanation: 'Es un cambio dentro de los Activos: sale dinero líquido pero entra un bien (inventario) de igual valor.'
          }
        ]
      },
      {
        id: 'flujo-de-caja',
        title: 'Flujo de caja',
        description: 'No confundas ventas con dinero en el banco.',
        category: 'Tesorería',
        status: 'completed',
        progress: 100,
        content: [
          { type: 'text', value: '¡Cuidado! Puedes vender mucho y aún así quedarte sin dinero para pagar la renta. El Flujo de Caja rastrea el efectivo real.' },
          { type: 'diagram', value: 'Flujo: Cobros a clientes (+) -> Pagos a proveedores (-) -> Gastos fijos (-) = Saldo' },
          { type: 'tip', value: 'Intenta cobrar rápido y pagar con plazos. Eso te dará "oxígeno" financiero.' }
        ],
        quiz: [
          {
            question: '¿Por qué el flujo de caja es diferente a la utilidad?',
            options: [
              'Porque la utilidad incluye ventas que aún no has cobrado',
              'Porque el flujo de caja solo cuenta las ganancias',
              'Son lo mismo en negocios pequeños'
            ],
            correctIndex: 0,
            explanation: 'Vender algo por $100 genera utilidad, pero si te lo pagan el próximo mes, hoy tienes $0 en tu flujo de caja.'
          }
        ]
      },
      {
        id: 'registro-ingresos-gastos',
        title: 'Registro de movimientos',
        description: 'La disciplina diaria que salva negocios.',
        category: 'Operaciones',
        status: 'completed',
        progress: 100,
        content: [
          { type: 'text', value: 'Anotar cada centavo es la única forma de saber por dónde se "fuga" el dinero en tu día a día.' },
          { type: 'tip', value: 'Separa tus finanzas personales de las del negocio. Págate un sueldo fijo y no uses la caja del negocio para gastos propios.' },
          { type: 'text', value: 'Un buen registro debe incluir: Fecha, Concepto, Monto y Categoría (Venta, Compra, Servicio, etc).' }
        ],
        quiz: [
          {
            question: '¿Qué es lo más importante al registrar un gasto?',
            options: [
              'Tener una memoria excelente',
              'Clasificarlo correctamente para saber en qué gastas más',
              'Anotarlo solo si es un monto grande'
            ],
            correctIndex: 1,
            explanation: 'La clasificación te permite generar reportes útiles. Si no clasificas, solo tienes una lista de números sin significado.'
          }
        ]
      },
      {
        id: 'gestion-inventario',
        title: 'Gestión de inventario',
        description: 'Evita tener dinero "empolvado" en la estantería.',
        category: 'Logística',
        status: 'completed',
        progress: 100,
        content: [
          { type: 'text', value: 'El inventario es dinero en forma de productos. Si tienes de más, ese dinero no está trabajando para ti.' },
          { type: 'tip', value: 'Usa el método FIFO (First In, First Out). Lo primero que entra es lo primero que debe salir para evitar mermas.' },
          { type: 'text', value: 'Llevar un conteo cíclico te ayuda a detectar robos hormiga o errores en el registro sin cerrar el local.' }
        ],
        quiz: [
          {
            question: '¿Por qué es malo tener un inventario excesivo?',
            options: [
              'Porque ocupas mucho espacio',
              'Porque es dinero estancado que podrías usar para otra cosa',
              'No es malo, siempre es mejor tener de más'
            ],
            correctIndex: 1,
            explanation: 'El exceso de stock tiene costos de oportunidad y riesgos de deterioro o desfase de precios.'
          }
        ]
      },
      {
        id: 'roi-medicion',
        title: 'Retorno de Inversión (ROI)',
        description: 'Mide el éxito de tus inversiones y gastos publicitarios.',
        category: 'Estrategia',
        status: 'completed',
        progress: 100,
        content: [
          { type: 'text', value: 'El ROI (Return on Investment) es la métrica reina para saber si un dinero que salió del negocio volvió con ganancias.' },
          { type: 'tip', value: 'Fórmula ROI: [(Ganancia - Inversión) / Inversión] x 100.' },
          { type: 'example', value: 'Si gastas $200 en publicidad y eso te genera $600 en ventas adicionales, tu ROI es del 200%. Por cada peso invertido, ganaste 2 de utilidad.' }
        ],
        quiz: [
          {
            question: 'Si inviertes $1,000 en una máquina que te ahorra $1,200 en un año, ¿cuál es el ROI?',
            options: [
              '20%',
              '120%',
              '200%'
            ],
            correctIndex: 0,
            explanation: 'ROI = (1200 - 1000) / 1000 = 0.20, es decir, un 20% de retorno sobre la inversión inicial.'
          }
        ]
      },
      {
        id: 'formulas-inventario',
        title: 'Fórmulas de Inventario',
        description: 'Aprende a calcular cuándo comprar y qué tan rápido vendes.',
        category: 'Logística',
        status: 'completed',
        progress: 100,
        content: [
          { type: 'text', value: 'La Rotación de Inventario indica cuántas veces renuevas tu stock en un periodo. Una rotación alta suele significar eficiencia.' },
          { type: 'tip', value: 'Fórmula Rotación: Costo de Ventas / Inventario Promedio.' },
          { type: 'text', value: 'El Punto de Reorden te dice cuándo es momento de pedir más mercancía antes de que te quedes en cero.' },
          { type: 'tip', value: 'Fórmula Reorden: (Uso diario x Tiempo de entrega) + Stock de seguridad.' }
        ],
        quiz: [
          {
            question: 'Si tu rotación de inventario es 12 al año, ¿qué significa?',
            options: [
              'Que vendes toda tu mercancía una vez al mes',
              'Que tienes mucha mercancía estancada',
              'Que debes 12 facturas a proveedores'
            ],
            correctIndex: 0,
            explanation: '12 rotaciones al año significa que, en promedio, tu inventario se vacía y se llena completamente cada mes.'
          }
        ]
      }
    ]
  }
];

export const glossary = [
  { term: 'Activo', definition: 'Bienes y derechos que posee la empresa (dinero, inventario, maquinaria).' },
  { term: 'Pasivo', definition: 'Deudas y obligaciones con terceros (bancos, proveedores).' },
  { term: 'Patrimonio', definition: 'El valor real de la empresa después de restar las deudas a los activos.' },
  { term: 'Liquidez', definition: 'Capacidad de transformar activos en dinero en efectivo de forma inmediata.' },
  { term: 'ROI', definition: 'Retorno de Inversión. Cuánto dinero ganas por cada peso invertido.' }
];
