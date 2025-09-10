# Changelog

Todas as mudanças significativas do projeto serão listadas aqui. Use o padrão Keep A Changelog e semântica de versão.

## [Unreleased]
- Trabalho contínuo e correções menores.

## [v0.1.0-beta.1] - 2025-09-10

### Added

- Criação de split (despesa compartilhada).
- Listagem de splits.
- Visualização de split (detalhes da despesa e participantes).
- Autenticação: login / logout.
- Recuperação de senha (reset).
- Filtro funcional em listagens (busca/filtragem básica).
- Sistema de exclusão de split (remover despesa).

### Changed / Fixed

- Ajustes no frontend/back-end para persistência e listagem de participantes em Splits.
- Proteções (guards) adicionadas em telas para prevenir erros ao acessar propriedades indefinidas (ex.: PendingApprovals, Show).
- Correção em workflow `release-sentry.yml` para evitar comando inválido durante releases.

### Known issues (problemas conhecidos)

- Dashboard: ainda em desenvolvimento — algumas métricas e widgets ausentes.
- Edição de split: funcionalidade disponível, porém instável — use com cautela.
- Controle de user balance: lógica presente, mas ainda sujeita a inconsistências em casos complexos.
- Landing page SPA inicial: não implementada nesta versão.
- Testes automatizados: recomenda-se rodar a suíte localmente e revisar falhas antes de confiar em CI.

### Migration / Notes

- A UI exibe a versão lida do arquivo `VERSION` e/ou da variável `APP_VERSION` no `.env`.
- Para publicar a tag e disparar os workflows de release: crie uma tag semântica (ex.: `v0.1.0-beta.1`) e faça push para o repositório.

---

## [0.1.0] - YYYY-MM-DD
- Lançamento inicial com versão instável prevista
