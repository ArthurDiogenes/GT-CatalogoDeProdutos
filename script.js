const SUPABASE_URL = 'https://ltfwwxsrdoiqukhloldo.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx0Znd3eHNyZG9pcXVraGxvbGRvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY3MjE4MzUsImV4cCI6MjA2MjI5NzgzNX0.GT1cDhVR9QuNvk_VW84B4fazrIn2hD6yb2FbNLsrm0I'

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY)
console.log("Supabase inicializado")

let produtos = []

async function carregarProdutos() {
  try {
    console.log("Carregando produtos do Supabase...")
    const produtosContainer = document.getElementById('produtos')
    produtosContainer.innerHTML = '<div class="loading">Carregando produtos...</div>'
    
    const { data, error } = await supabase
      .from('produtos')
      .select('*')
      .order('id')
    
    if (error) {
      console.error("Erro na consulta:", error)
      throw error
    }
    
    console.log(`${data.length} produtos carregados:`, data)
    produtos = data
    renderizarProdutos()
  } catch (error) {
    console.error('Erro ao carregar produtos:', error)
    document.getElementById('produtos').innerHTML = 
      '<div class="error-message">Não foi possível carregar os produtos. Por favor, tente novamente mais tarde.</div>'
  }
}

function formataPreco(preco) {
  if (preco === null || preco === undefined) {
    console.warn("Tentativa de formatar preço nulo ou indefinido")
    return "Preço indisponível"
  }
  
  return preco.toLocaleString('pt-BR', { 
    style: 'currency', 
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}

function renderizarProdutos() {
  console.log("Renderizando produtos na página...")
  const produtosContainer = document.getElementById('produtos')
  produtosContainer.innerHTML = ''

  if (!produtos || produtos.length === 0) {
    produtosContainer.innerHTML = '<p class="sem-produtos">Nenhum produto disponível no momento.</p>'
    return
  }

  produtos.forEach(produto => {
    const produtoCard = document.createElement('div')
    produtoCard.className = 'produto-card'

    const produtoInfo = document.createElement('div')
    produtoInfo.className = 'produto-info'

    const produtoNome = document.createElement('h3')
    produtoNome.className = 'produto-nome'
    produtoNome.textContent = produto.nome

    const produtoDescricao = document.createElement('p')
    produtoDescricao.className = 'produto-descricao'
    produtoDescricao.textContent = produto.descricao

    const produtoPreco = document.createElement('div')
    produtoPreco.className = 'produto-preco'
    
    if (produto.tem_desconto) {
      console.log(`Produto ${produto.id} tem desconto: original=${produto.preco_original}, com desconto=${produto.preco}`)
      
      const precoOriginal = document.createElement('span')
      precoOriginal.className = 'preco-original'
      precoOriginal.textContent = formataPreco(produto.preco_original)

      const precoDesconto = document.createElement('span')
      precoDesconto.className = 'preco-desconto'
      precoDesconto.textContent = formataPreco(produto.preco)

      produtoPreco.appendChild(precoOriginal)
      produtoPreco.appendChild(precoDesconto)
    } else {
      produtoPreco.textContent = formataPreco(produto.preco)
    }
    
    produtoInfo.appendChild(produtoNome)
    produtoInfo.appendChild(produtoDescricao)
    produtoInfo.appendChild(produtoPreco)

    produtoCard.appendChild(produtoInfo)
    produtosContainer.appendChild(produtoCard)
  })
  
  console.log("Produtos renderizados com sucesso")
}

async function aplicarDesconto() {
  try {
    console.log("Iniciando aplicação de descontos...")
    
    const btnDesconto = document.getElementById('aplicarDesconto')
    btnDesconto.disabled = true
    btnDesconto.textContent = 'Aplicando desconto...'
    
    console.log("Buscando produtos sem desconto...")
    const { data: produtosSemDesconto, error: errorFetch } = await supabase
      .from('produtos')
      .select('*')
      .eq('tem_desconto', false)
    
    if (errorFetch) {
      console.error("Erro ao buscar produtos sem desconto:", errorFetch)
      throw errorFetch
    }
    
    if (!produtosSemDesconto || produtosSemDesconto.length === 0) {
      console.log("Nenhum produto disponível para aplicar desconto")
      alert('Todos os produtos já possuem desconto!')
      btnDesconto.disabled = false
      btnDesconto.textContent = 'Aplicar Desconto de 10%'
      return
    }
    
    console.log(`Aplicando desconto a ${produtosSemDesconto.length} produtos...`)
    
    for (const produto of produtosSemDesconto) {
      const precoOriginal = parseFloat(produto.preco)
      const novoPreco = parseFloat((precoOriginal * 0.9).toFixed(2))
      
      console.log(`Produto ${produto.id}: ${produto.nome} - Preço original: ${precoOriginal}, Novo preço: ${novoPreco}`)
      
      const { error: errorUpdate } = await supabase
        .from('produtos')
        .update({
          preco_original: precoOriginal,
          preco: novoPreco,
          tem_desconto: true
        })
        .eq('id', produto.id)
      
      if (errorUpdate) {
        console.error(`Erro ao atualizar produto ${produto.id}:`, errorUpdate)
        throw errorUpdate
      }
      
      console.log(`Produto ${produto.id} atualizado com sucesso`)
    }
    
    console.log("Recarregando produtos após aplicar descontos...")
    await carregarProdutos()
    
    console.log("Descontos aplicados com sucesso!")
    alert(`Desconto de 10% aplicado com sucesso a ${produtosSemDesconto.length} produtos!`)
    
  } catch (error) {
    console.error('Erro ao aplicar desconto:', error)
    alert('Não foi possível aplicar o desconto. Por favor, tente novamente.')
    
    const produtosContainer = document.getElementById('produtos')
    produtosContainer.innerHTML = `
      <div class="error-message">
        Erro ao aplicar desconto: ${error.message || 'Erro desconhecido'}
      </div>
    ` + produtosContainer.innerHTML
    
  } finally {
    const btnDesconto = document.getElementById('aplicarDesconto')
    btnDesconto.disabled = false
    btnDesconto.textContent = 'Aplicar Desconto de 10%'
  }
}

document.getElementById('aplicarDesconto').addEventListener('click', aplicarDesconto)

document.addEventListener('DOMContentLoaded', () => {
  console.log("Página carregada, iniciando aplicação...")
  carregarProdutos()
})