// controllers/generateDoc.js

const {
  Document,
  Packer,
  Paragraph,
  TextRun,
  AlignmentType,
  Table,
  TableRow,
  TableCell,
  ImageRun,
  BorderStyle,
  VerticalAlign,
  WidthType,
} = require('docx');
const fs = require('fs');
const path = require('path');

// Gera o documento DOCX
const generateDoc = async (dados) => {
  const {
    nome,
    rg,
    cpf,
    cnh,
    dia,
    horas,
    carro, // Usado no lugar de 'modelo'
    placa,
    clienteBase64,
    vendedorBase64,
    vendedor,
  } = dados;

  // Decodifica as assinaturas Base64
  const cliente_sign = Buffer.from(clienteBase64.split(",")[1], 'base64');
  const vendor_sign = Buffer.from(vendedorBase64.split(",")[1], 'base64');

  // Parágrafos de exemplo (você pode personalizar ainda mais)
  const tituloPrincipal = new Paragraph({
    children: [
      new TextRun({
        text: "ARIEL AUTOMÓVEIS",
        font: { name: "Calibri (Corpo)" },
        size: 52,
        bold: true,
        color: "000000",        
      }),
    ],
    alignment: AlignmentType.CENTER,
    spacing: { after: 200 },
  });

  const subTitulo = new Paragraph({
    children: [
      new TextRun({
        text: "Termo de Responsabilidade - BEST DRIVE",
        font: { name: "Calibri (Corpo)" },
        size: 44,
        bold: false,
        color: "000000",        
      }),
    ],
    alignment: AlignmentType.CENTER,
    spacing: { after: 500 },
  });

  const texto1 = new Paragraph({
    children: [
      new TextRun({
        text: `Eu, ${nome}, portador do RG nº ${rg}, CPF nº ${cpf}, e CNH nº ${cnh}, `,
        font: { name: "Calibri (Corpo)" },
        size: 24,
        bold: false,
        color: "000000",    
      }),
      new TextRun({
        text: `na qualidade de participante de um “test drive” realizado em Várzea Grande–MT, no dia ${dia} às ${horas} horas, `,
        font: { name: "Calibri (Corpo)" },
        italics: true,
        size: 24,
        bold: true,
        color: "000000",    
      }),
      new TextRun({
        text: `declaro estar em plenas condições físicas e psicológicas para conduzir o veículo de propriedade da Ariel Automóveis Várzea Grande LTDA durante o referido teste. `,
        font: { name: "Calibri (Corpo)" },
        size: 24, 
        bold: false,
        color: "000000",    
      }),
    ],
    spacing: { after: 300 },
  });

  const texto2 = new Paragraph({
    children: [
      new TextRun({
        text: "Declaro, ainda, que assumo total responsabilidade, civil e criminal, de acordo com a legislação vigente, ",
        font: { name: "Calibri (Corpo)" },
        size: 24, // 48 pontos no formato docx
        bold: false,
        color: "000000",    
      }),
      new TextRun({
        text: `por quaisquer atos decorrentes da minha conduta durante a direção do veículo modelo (${carro}), placa (${placa}), `,
        font: { name: "Calibri (Corpo)" },
        size: 24, // 48 pontos no formato docx
        bold: false,
        color: "000000",    
      }),
      new TextRun({
        text: "que me foi confiado pela referida empresa. Comprometo-me a responder integralmente por eventuais infrações de trânsito, multas, danos materiais ou morais, seja à empresa, a terceiros ou a mim mesmo, isentando desde já a Ariel Automóveis de qualquer responsabilidade nesse sentido.",
        font: { name: "Calibri (Corpo)" },
        size: 24, // 48 pontos no formato docx
        bold: false,
        color: "000000",    
      }),
    ],
    spacing: { after: 300 },
  });

  const texto3 = new Paragraph({
    children: [
      new TextRun({
        text: "Concordo, também, em fornecer à Ariel Automóveis os meus dados pessoais acima e a imagem da minha CNH, exclusivamente para controle interno relativo à utilização de veículos e à realização de test drives.",
        font: { name: "Calibri (Corpo)" },
        size: 24, // 48 pontos no formato docx
        bold: false,
        color: "000000",    
      }),
    ],
    spacing: { after: 300 },
  });

  // Lista de Informações Importantes
  const infoTitle = new Paragraph({
    children: [
      new TextRun({
        text: "Informações Importantes:",
        font: { name: "Calibri (Corpo)" },
        size: 24, // 48 pontos no formato docx
        bold: true,
        color: "000000",    
      }),
    ],
    spacing: { after: 300 },
  });

  const info1 = new Paragraph({
    children: [
      new TextRun({
        text: "O condutor deverá obrigatoriamente ser habilitado e apresentar a CNH para cópia.",
        font: { name: "Arial"},
      }),
    ],
    bullet: { level: 0 },
    spacing: { after: 200 },
  });

  const info2 = new Paragraph({
    children: [
      new TextRun({
        text: "É obrigatório respeitar a sinalização de trânsito e os limites de velocidade estabelecidos para segurança.",
        font: { name: "Arial"},
      }),
    ],
    bullet: { level: 0 },
    spacing: { after: 200 },
  });

  const info3 = new Paragraph({
    children: [
      new TextRun({
        text: "Todas as multas, infrações de trânsito, bem como eventuais danos causados ao veículo da empresa, a veículos de terceiros ou a pedestres, serão de responsabilidade exclusiva do condutor.",
        font: { name: "Arial"},
      }),
    ],
    bullet: { level: 0 },
    spacing: { after: 600 },
  });

  const assinaturaTable = new Table({
    rows: [
      new TableRow({
        children: [
          new TableCell({
            children: [
              new Paragraph({
                children: [
                  new ImageRun({
                    data: cliente_sign,
                    transformation: {
                      width: 200,
                      height: 100,
                    },
                  }),
                ],
                alignment: AlignmentType.CENTER, // Alinha imagem no centro
              }),
              new Paragraph({
                text: `${nome}`,
                alignment: AlignmentType.CENTER, // Alinha o nome no centro
                spacing: { before: 0, after: 0 }, // Remove espaçamento desnecessário
              }),
            ],
            verticalAlign: VerticalAlign.CENTER, // Alinha verticalmente no centro da célula
            width: { size: 50, type: WidthType.PERCENTAGE },
          }),
          new TableCell({
            children: [
              new Paragraph({
                children: [
                  new ImageRun({
                    data: vendor_sign,
                    transformation: {
                      width: 200,
                      height: 100,
                    },
                  }),
                ],
                alignment: AlignmentType.CENTER, // Alinha imagem no centro
              }),
              new Paragraph({
                text: `${vendedor}`,
                alignment: AlignmentType.CENTER, // Alinha o nome no centro
                spacing: { before: 0, after: 0 }, // Remove espaçamento desnecessário
              }),
            ],
            verticalAlign: VerticalAlign.CENTER, // Alinha verticalmente no centro da célula
            width: { size: 50, type: WidthType.PERCENTAGE },
          }),
        ],
      }),
    ],
    width: { size: 140, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
      bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
      left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
      right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
      insideHorizontal: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
      insideVertical: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
    },
    alignment: AlignmentType.CENTER,
    spacing: { before: 400 },
  });

  // Monta o documento
  const doc = new Document({
    sections: [
      {
        children: [
          tituloPrincipal,
          subTitulo,
          texto1,
          texto2,
          texto3,
          infoTitle,
          info1,
          info2,
          info3,
          assinaturaTable,
        ],
      },
    ],
  });

  // Gera o documento como buffer
  const buffer = await Packer.toBuffer(doc);

  const data = dia + horas;
  const formattedDate = data
    .replace(/\//g, '-')
    .replace(/\s+/g, '_')
    .replace(/,/g, '')
    .replace(/:/g, '_');

  // Define o caminho para salvar o documento
  const outputPath = path.join(
    __dirname,
    '../arquivos/termo_responsabilidade',
    `Termo_Responsabilidade_${nome.replace(/\s+/g, '_')}_${formattedDate}.docx`
  );

  // Salva o buffer no sistema de arquivos
  fs.writeFileSync(outputPath, buffer);

  return outputPath; // Retorna o caminho do arquivo gerado
};

module.exports = generateDoc;
