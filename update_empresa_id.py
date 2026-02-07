import re
import os

# Lista de arquivos para atualizar
files_to_update = [
    r"c:\Users\pacpa\.gemini\antigravity\scratch\pac-oficinas\src\app\(dashboard)\estoque\page.tsx",
    r"c:\Users\pacpa\.gemini\antigravity\scratch\pac-oficinas\src\app\(dashboard)\servicos\page.tsx",
    r"c:\Users\pacpa\.gemini\antigravity\scratch\pac-oficinas\src\app\(dashboard)\financeiro\page.tsx",
    r"c:\Users\pacpa\.gemini\antigravity\scratch\pac-oficinas\src\app\(dashboard)\relatorios\page.tsx",
    r"c:\Users\pacpa\.gemini\antigravity\scratch\pac-oficinas\src\app\(dashboard)\os\page.tsx",
    r"c:\Users\pacpa\.gemini\antigravity\scratch\pac-oficinas\src\app\(dashboard)\os\nova\page.tsx",
    r"c:\Users\pacpa\.gemini\antigravity\scratch\pac-oficinas\src\app\(dashboard)\os\[id]\page.tsx",
    r"c:\Users\pacpa\.gemini\antigravity\scratch\pac-oficinas\src\app\(dashboard)\orcamentos\novo\page.tsx",
    r"c:\Users\pacpa\.gemini\antigravity\scratch\pac-oficinas\src\app\(dashboard)\nfse\emitir\page.tsx",
    r"c:\Users\pacpa\.gemini\antigravity\scratch\pac-oficinas\src\app\(dashboard)\nfe\emitir\page.tsx",
    r"c:\Users\pacpa\.gemini\antigravity\scratch\pac-oficinas\src\app\(dashboard)\xml\page.tsx",
]

def update_file(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        
        # 1. Adicionar import do getUserEmpresaId
        if 'getUserEmpresaId' not in content:
            content = re.sub(
                r"(import { createClient } from '@/lib/supabase/client';)",
                r"\1\nimport { getUserEmpresaId } from '@/lib/supabase/helpers';",
                content
            )
        
        # 2. Remover a constante TEMP_EMPRESA_ID
        content = re.sub(
            r"\n\nconst TEMP_EMPRESA_ID = '[^']+';",
            "",
            content
        )
        
        # 3. Adicionar estado empresaId (procurar pelo supabase = createClient())
        if 'const [empresaId, setEmpresaId]' not in content:
            content = re.sub(
                r"(const supabase = createClient\(\);)",
                r"const [empresaId, setEmpresaId] = useState<string | null>(null);\n\n    \1",
                content
            )
        
        # 4. Adicionar useEffect para carregar empresaId
        if 'loadEmpresaId' not in content:
            # Encontrar o primeiro useEffect
            first_useeffect_match = re.search(r'(\n    useEffect\(\(\) => \{)', content)
            if first_useeffect_match:
                insert_pos = first_useeffect_match.start()
                load_empresa_code = """
    useEffect(() => {
        async function loadEmpresaId() {
            const id = await getUserEmpresaId();
            setEmpresaId(id);
        }
        loadEmpresaId();
    }, []);

"""
                content = content[:insert_pos] + load_empresa_code + content[insert_pos:]
        
        # 5. Substituir todas as ocorrências de TEMP_EMPRESA_ID por empresaId
        content = content.replace('TEMP_EMPRESA_ID', 'empresaId')
        
        # 6. Adicionar verificação if (!empresaId) return; nos useEffects que fazem queries
        # (isso é mais complexo e específico para cada arquivo, então vou deixar manual)
        
        if content != original_content:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"✅ Atualizado: {os.path.basename(filepath)}")
            return True
        else:
            print(f"⏭️  Sem mudanças: {os.path.basename(filepath)}")
            return False
            
    except Exception as e:
        print(f"❌ Erro em {os.path.basename(filepath)}: {e}")
        return False

if __name__ == "__main__":
    print("🔧 Atualizando arquivos para usar empresa_id dinâmico...\n")
    
    updated_count = 0
    for filepath in files_to_update:
        if os.path.exists(filepath):
            if update_file(filepath):
                updated_count += 1
        else:
            print(f"⚠️  Arquivo não encontrado: {os.path.basename(filepath)}")
    
    print(f"\n✨ Concluído! {updated_count} arquivos atualizados.")
