async function buscarCNPJ() {
    const inputCNPJ = document.getElementById('cnpj').value.replace(/[^\d]/g, '');
    const url = `https://brasilapi.com.br/api/cnpj/v1/${inputCNPJ}`;

    try {
        const resposta = await fetch(url);

        if (!resposta.ok) {
            throw new Error(`Erro HTTP: ${resposta.status}`);
        }

        const dados = await resposta.json();
        mostrarResultado(dados);

    } catch (erro) {
        console.error('Erro:', erro);
        document.getElementById('resultado').innerHTML = `<p>Erro: ${erro.message}</p>`;
    }
}

function mostrarResultado(dados) {
    const cnaesSecundarios = dados.cnaes_secundarios.map(cnae =>
        `<li>${cnae.codigo} - ${cnae.descricao}</li>`
    ).join('');

    document.getElementById('resultado').innerHTML = `
        <h2>Informações da Empresa</h2>
        <p><strong>Razão Social:</strong> ${dados.razao_social}</p>
        <p><strong>Nome Fantasia:</strong> ${dados.nome_fantasia || "Não disponível"}</p>
        <p><strong>CNPJ:</strong> ${dados.cnpj}</p>
        <p><strong>Atividade Principal:</strong> ${dados.cnae_fiscal_descricao}</p>
        <p><strong>Capital Social:</strong> R$ ${dados.capital_social}</p>
        <p><strong>Endereço:</strong> ${dados.descricao_tipo_logradouro} ${dados.logradouro}, Nº ${dados.numero}, ${dados.complemento || ''}, Bairro: ${dados.bairro}, ${dados.municipio} - ${dados.uf}, ${dados.cep}</p>
        <p><strong>Natureza Jurídica:</strong> ${dados.natureza_juridica}</p>
        <p><strong>Situação Cadastral:</strong> ${dados.descricao_situacao_cadastral} desde ${dados.data_situacao_cadastral}</p>
        <p><strong>Telefone:</strong> ${dados.ddd_telefone_1 ? `(${dados.ddd_telefone_1})` : ""}</p>
        <p><strong>Opção pelo MEI:</strong> ${dados.opcao_pelo_mei ? "Sim" : "Não"}, desde ${dados.data_opcao_pelo_mei || "N/A"}</p>
        <p><strong>Opção pelo Simples Nacional:</strong> ${dados.opcao_pelo_simples ? "Sim" : "Não"}, desde ${dados.data_opcao_pelo_simples || "N/A"}</p>
        <p><strong>CNAEs Secundários:</strong>
            <ul>${cnaesSecundarios}</ul>
        </p>
    `;
}

function exportarParaPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const titulo = "Informações da Empresa";
    const subTituloY = 10;
    let y = 20;

    doc.setFontSize(16);
    doc.text(titulo, 10, subTituloY);
    doc.setFontSize(12);

    const resultado = document.querySelectorAll('#resultado p, #resultado h2, #resultado ul, #resultado li');

    resultado.forEach((item) => {
        let linhaAtual = item.tagName === 'UL' ? '' : item.textContent;
        let splitTexto = doc.splitTextToSize(linhaAtual, 180);

        splitTexto.forEach((linha, i) => {
            if (y > 280) {
                doc.addPage();
                y = 10;
            }

            if (item.tagName === 'H2' && i === 0) {
                doc.setFontSize(14);
                doc.text(linha, 10, y);
                doc.setFontSize(12);
            } else if (item.tagName === 'LI') {
                doc.text(`- ${linha}`, 15, y);
            } else {
                doc.text(linha, 10, y);
            }

            y += 10;
        });
    });

    doc.save('informacoes-empresa.pdf');
}

function exportarParaExcel() {
    try {
        // Verifica se a biblioteca XLSX está carregada
        if (typeof XLSX === 'undefined') {
            throw new Error('Biblioteca SheetJS não foi carregada. Verifique o script no HTML.');
        }

        const wb = XLSX.utils.book_new();
        const ws_data = [];
        const resultado = document.querySelectorAll('#resultado p, #resultado h2, #resultado ul, #resultado li');

        // Verifica se há dados para exportar
        if (resultado.length === 0) {
            throw new Error('Nenhum dado encontrado para exportar. Busque um CNPJ primeiro.');
        }

        resultado.forEach((item) => {
            if (item.tagName === 'LI') {
                ws_data.push([`• ${item.textContent.trim()}`]);
            } else if (item.tagName !== 'UL') {
                ws_data.push([item.textContent.trim()]);
            }
        });

        // CORREÇÃO: função correta
        const ws = XLSX.utils.aoa_to_sheet(ws_data);
        
        // Ajusta a largura da coluna para melhor visualização
        ws['!cols'] = [{ wch: 80 }];
        
        XLSX.utils.book_append_sheet(wb, ws, "Informações da Empresa");
        XLSX.writeFile(wb, 'informacoes-empresa.xlsx');
        
        console.log('Arquivo Excel exportado com sucesso!');
        
    } catch (erro) {
        console.error('Erro ao exportar para Excel:', erro);
        alert('Erro ao exportar para Excel: ' + erro.message);
    }
}