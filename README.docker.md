# Docker - split-control

Este guia rápido mostra como rodar o projeto `split-control` em Docker localmente.

Pré-requisitos
- Docker Desktop instalado
- No Windows, use `cmd.exe` (exemplos abaixo usam `cmd`) ou PowerShell

Passos básicos
1. Copie o arquivo `.env.example` para `.env` e ajuste conforme necessário. Se você usar SQLite não é necessário configurar DB_CONNECTION.

2. Build e start:

```cmd
docker compose build
docker compose up -d
```

3. Acesse a aplicação
- Abra `http://localhost:8080` no navegador. Nginx encaminha para o PHP-FPM no container `app`.

Comandos úteis
- Ver logs do container app:

```cmd
docker compose logs -f app
```

- Abrir um shell no container app (para rodar artisan, composer, etc):

```cmd
docker compose exec app sh
# dentro do container
php artisan migrate --seed
php artisan key:generate
```

Notas
- O `Dockerfile` usa PHP 8.2-FPM e Composer já está embutido.
- O `entrypoint.sh` instala dependências via Composer se `vendor` não existir.
- O projeto monta o diretório atual no container, então mudanças locais são refletidas imediatamente.
- Por padrão o docker-compose mapeia `80` do container para `8080` na máquina host.

Atenção
- Evite rodar `php artisan migrate --force` em ambientes de produção sem backups.
