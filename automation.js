const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');
const crypto = require('crypto');

// URL da API do Bubble
const apiUrl = 'https://flashguyscleaning.com/version-test/api/1.1/wf/blogposts';

// Função para calcular o hash do conteúdo
function calcularHash(content) {
    return crypto.createHash('sha256').update(content, 'utf8').digest('hex');
}

// Função para fazer a requisição e salvar os arquivos com o nome correto
async function baixarArquivos() {
    try {
        const response = await axios.get(apiUrl);

        // Verifica se a resposta contém dados
        if (!Array.isArray(response.data) || response.data.length === 0) {
            console.error('Nenhum conteúdo encontrado na resposta da API');
            return;
        }

        let arquivosBaixados = [];
        let arquivosAlterados = [];

        // Cria a pasta src, caso não exista
        const srcPath = path.join(__dirname, 'src/posts');
        await fs.ensureDir(srcPath);  // Garante que a pasta 'src' exista

        // Cria a pasta arquivados, caso não exista
        const arquivadosPath = path.join(__dirname, 'arquivados');
        await fs.ensureDir(arquivadosPath);  // Garante que a pasta 'arquivados' exista

        // Lista de arquivos na pasta src
        const arquivosLocais = await fs.readdir(srcPath);

        // Itera sobre os itens retornados pela API
        for (let i = 0; i < response.data.length; i++) {
            const post = response.data[i];

            // Extrai o conteúdo do post
            const content = post.content;

            // Verifica se o campo file_name existe, se não, usa o ID para gerar o nome do arquivo
            const fileName = post.file_name || `post-${post.id}.md`;  // Usando o ID caso o file_name não esteja presente

            // Verifica se fileName é uma string válida
            if (!fileName || typeof fileName !== 'string' || fileName.trim() === '') {
                console.error(`Nome de arquivo inválido para o post ${post.id}`);
                continue; // Pule esse post se o nome for inválido
            }

            // Caminho onde o arquivo será salvo
            const downloadPath = path.join(srcPath, fileName);

            // Verifica se o arquivo já existe
            const arquivoExiste = await fs.pathExists(downloadPath);
            const novoHash = calcularHash(content); // Calcula o hash do conteúdo do novo arquivo

            if (arquivoExiste) {
                // Lê o conteúdo atual do arquivo para calcular o hash existente
                const conteudoAtual = await fs.readFile(downloadPath, 'utf8');
                const hashAtual = calcularHash(conteudoAtual);

                // Verifica se o conteúdo mudou
                if (novoHash !== hashAtual) {
                    // Arquivo foi alterado, então substituímos o conteúdo
                    await fs.writeFile(downloadPath, content);
                    arquivosAlterados.push(fileName); // Adiciona à lista de arquivos alterados
                } else {
                    // O conteúdo é igual, nada precisa ser feito
                    continue;
                }
            } else {
                // Arquivo não existe, então é um novo arquivo
                await fs.ensureDir(path.dirname(downloadPath)); // Cria o diretório se não existir
                await fs.writeFile(downloadPath, content);
                arquivosBaixados.push(fileName); // Adiciona à lista de arquivos baixados
            }
        }

        // Mover arquivos locais que não existem mais na API para a pasta 'arquivados'
        for (const arquivoLocal of arquivosLocais) {
            const arquivoLocalPath = path.join(srcPath, arquivoLocal);
            const arquivoNaApi = response.data.some(post => {
                const fileName = post.file_name || `post-${post.id}.md`;
                return fileName === arquivoLocal;
            });

            // Se o arquivo não estiver na API, ele será movido para a pasta 'arquivados'
            if (!arquivoNaApi) {
                const arquivoArquivadoPath = path.join(arquivadosPath, arquivoLocal);
                await fs.move(arquivoLocalPath, arquivoArquivadoPath); // Move o arquivo
                console.log(`Arquivo movido para 'arquivados': ${arquivoLocal}`);
            }
        }

        // Exibe os resultados
        if (arquivosBaixados.length > 0) {
            console.log('Arquivos Baixados:');
            arquivosBaixados.forEach((arquivo) => console.log(`- ${arquivo}`));
        }

        if (arquivosAlterados.length > 0) {
            console.log('Arquivos Alterados:');
            arquivosAlterados.forEach((arquivo) => console.log(`- ${arquivo}`));
        }

    } catch (error) {
        console.error('Erro ao baixar os arquivos:', error.message);
    }
}

// Executa a função
baixarArquivos();
