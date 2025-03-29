import json
import os
import sys
import random
import re
from rich.console import Console
from rich.text import Text
from rich.panel import Panel
from rich.layout import Layout
from rich.table import Table
from rich.prompt import Prompt
# Configuración
CARPETA_BASE = "dialogos"
ARCHIVO_RUTAS = "rutas.json"
CARPETA_TIRADAS = "tiradas"
CARPETA_DIALOGOS = "dialogos"
CARPETA_RELLENO = "relleno"

# Inicialización
console = Console()

# Estructura para mantener el estado del juego
estado_juego = {
    "stats": {
        "Ganas de vivir": 100,
        "Hambre intensa": 0,
        "Pipí acumulado": 0,
        "Miedo": 0,
        "Reputación": 50
    },
    "inventario": [],
    "rutas_visitadas": [],
    "habilidades": []
}

# Cargar un archivo JSON
def cargar_json(ruta_archivo):
    try:
        with open(ruta_archivo, 'r', encoding='utf-8') as archivo:
            return json.load(archivo)
    except FileNotFoundError:
        console.print(f"[bold red]Error: No se encontró el archivo {ruta_archivo}[/bold red]")
        return None
    except json.JSONDecodeError:
        console.print(f"[bold red]Error: El archivo {ruta_archivo} no contiene JSON válido[/bold red]")
        return None

# Buscar una ruta por su ID
def buscar_ruta(ruta_id):
    rutas = cargar_json(os.path.join(CARPETA_BASE, ARCHIVO_RUTAS))
    if not rutas:
        return None
    
    for ruta in rutas.get("rutas", []):
        if ruta.get("id") == ruta_id:
            return ruta
    
    return None

# Cargar diálogo específico
def cargar_dialogo(tipo, id_dialogo):
    archivo = os.path.join(CARPETA_BASE, CARPETA_DIALOGOS, f"{tipo}.json")
    datos = cargar_json(archivo)
    
    if not datos:
        return None
    
    for dialogo in datos.get("dialogos", []):
        if dialogo.get("id") == id_dialogo:
            return dialogo
    
    return None

# Cargar tirada específica
def cargar_tirada(tipo, id_tirada):
    archivo = os.path.join(CARPETA_BASE, CARPETA_TIRADAS, f"{tipo}.json")
    datos = cargar_json(archivo)
    
    if not datos:
        return None
    
    for tirada in datos.get("tiradas", []):
        if tirada.get("id") == id_tirada:
            return tirada
    
    return None

# Cargar fragmento de relleno
def cargar_relleno(id_relleno):
    archivo = os.path.join(CARPETA_BASE, CARPETA_RELLENO, "relleno.json")
    datos = cargar_json(archivo)
    
    if not datos:
        return None
    
    for relleno in datos.get("fragmentos", []):
        if relleno.get("id") == id_relleno:
            return relleno.get("texto", "")
    
    return ""

# Resolver referencias a fragmentos de relleno
def resolver_referencias(texto):
    patron = r'\${([^:]+):([^}]+)}'
    
    def reemplazar(coincidencia):
        tipo = coincidencia.group(1)
        id_ref = coincidencia.group(2)
        
        if tipo == "relleno":
            return cargar_relleno(id_ref)
        else:
            return f"[ERROR: Referencia no encontrada {tipo}:{id_ref}]"
    
    return re.sub(patron, reemplazar, texto)

# Función para realizar una tirada de dados
def tirada_dados(dificultad=10, modificador=0, inverso=False):
    # Simular tirada de D20
    resultado = random.randint(1, 20)
    resultado_modificado = resultado + modificador
    
    # Si es inverso, un modificador negativo ayuda (como en el caso del Miedo)
    if inverso:
        resultado_modificado = resultado - modificador
    
    # Mostrar animación de dados
    console.print("\n[bold cyan]Tirando dados...[/bold cyan]")
    for i in range(3):
        console.print(f"[dim]{random.randint(1, 20)}...[/dim]", end="\r")
        import time
        time.sleep(0.3)
    
    # Mostrar resultado final
    if resultado == 20:
        console.print(f"[bold green]¡CRÍTICO! Resultado: {resultado}[/bold green]")
    elif resultado == 1:
        console.print(f"[bold red]¡PIFIA! Resultado: {resultado}[/bold red]")
    else:
        color = "green" if resultado_modificado >= dificultad else "red"
        console.print(f"[{color}]Resultado: {resultado} (+ {modificador} = {resultado_modificado})[/{color}]")
    
    return resultado

# Determinar rango de resultado
def determinar_rango(resultado):
    if resultado == 1:
        return "1"
    elif 2 <= resultado <= 5:
        return "2-5"
    elif 6 <= resultado <= 10:
        return "6-10"
    elif 11 <= resultado <= 15:
        return "11-15"
    elif 16 <= resultado <= 19:
        return "16-19"
    elif resultado == 20:
        return "20"
    else:
        return "error"

# Mostrar escenario
def mostrar_escenario(ruta):
    if "escenario" not in ruta:
        return
    
    esc = ruta["escenario"]
    panel = Panel(
        Text(esc.get("descripcion", ""), style=f"bold {esc.get('color_texto', 'white')}"),
        title="[bold]ESCENARIO[/bold]",
        border_style=esc.get("color_fondo", "blue")
    )
    console.print(panel)
    
    if "elementos_destacados" in esc:
        elementos = ", ".join(esc["elementos_destacados"])
        console.print(f"[italic]Puedes ver: {elementos}[/italic]")
    
    if "ambiente" in esc:
        console.print(f"[dim]{esc['ambiente']}[/dim]")
    
    console.print("")  # Línea en blanco para separar

# Actualizar estadísticas del jugador
def actualizar_stats(efectos):
    if not efectos:
        return
    
    for stat, valor in efectos.items():
        if stat in estado_juego["stats"]:
            estado_juego["stats"][stat] += valor
            
            # Asegurar que los stats estén en rangos válidos
            estado_juego["stats"][stat] = max(0, min(100, estado_juego["stats"][stat]))
            
            # Mostrar cambio
            if valor > 0:
                console.print(f"[green]Tu '{stat}' ha aumentado en {valor}[/green]")
            elif valor < 0:
                console.print(f"[red]Tu '{stat}' ha disminuido en {abs(valor)}[/red]")

# Añadir objetos al inventario
def añadir_objetos(objetos):
    if not objetos:
        return
    
    for obj in objetos:
        estado_juego["inventario"].append(obj)
        nombre = obj.get("nombre", "objeto desconocido")
        if "cantidad" in obj:
            console.print(f"[green]Has obtenido: {nombre} x{obj['cantidad']}[/green]")
        else:
            console.print(f"[green]Has obtenido: {nombre}[/green]")

# Perder objetos del inventario
def perder_objetos(objetos):
    if not objetos:
        return
    
    for obj_nombre in objetos:
        # Buscar el objeto por nombre
        for i, obj in enumerate(estado_juego["inventario"]):
            if obj.get("nombre") == obj_nombre:
                perdido = estado_juego["inventario"].pop(i)
                console.print(f"[red]Has perdido: {perdido.get('nombre', 'objeto desconocido')}[/red]")
                break

# Mostrar estadísticas del jugador
def mostrar_stats():
    tabla = Table(title="Estadísticas")
    tabla.add_column("Stat", style="cyan")
    tabla.add_column("Valor", style="green")
    
    for stat, valor in estado_juego["stats"].items():
        color = "green"
        if valor < 30:
            color = "red"
        elif valor < 60:
            color = "yellow"
        
        tabla.add_row(stat, f"[{color}]{valor}[/{color}]")
    
    console.print(tabla)

# Mostrar inventario
def mostrar_inventario():
    if not estado_juego["inventario"]:
        console.print("[yellow]Tu inventario está vacío.[/yellow]")
        return
    
    tabla = Table(title="Inventario")
    tabla.add_column("Objeto", style="cyan")
    tabla.add_column("Descripción", style="green")
    
    for objeto in estado_juego["inventario"]:
        tabla.add_row(
            objeto.get("nombre", "???"),
            objeto.get("descripcion", "Sin descripción")
        )
    
    console.print(tabla)

def mostrar_secuencia(secuencia):
    ultimo_personaje = None
    
    for dialogo in secuencia:
        personaje = dialogo.get("personaje", "???")
        texto_original = dialogo.get("texto", "...")
        
        # Resolver referencias
        texto = resolver_referencias(texto_original)
        
        # Crear texto enriquecido
        estilo_personaje = "bold cyan"
        if personaje == "NARRADOR":
            estilo_personaje = "bold yellow"
        elif "GUARDIA" in personaje:
            estilo_personaje = "bold red"
        
        rich_text = Text(f"\n{personaje}: ", style=estilo_personaje)
        rich_text.append(texto, style="white")
        
        # Mostrar diálogo
        console.print(rich_text)
        
        # Si cambia el personaje que habla, hacer una pausa
        if ultimo_personaje != personaje and ultimo_personaje is not None:
            input("\nPresiona Enter para continuar...")
        
        ultimo_personaje = personaje
        
        # Si hay pausa explícita, esperar input
        if dialogo.get("pausa", False):
            input("\nPresiona Enter para continuar...")
            
            
# Procesar una tirada y mostrar el resultado
def procesar_tirada(tirada):
    if not tirada:
        console.print("[bold red]Error: Tirada no encontrada[/bold red]")
        return None
    
    # Mostrar descripción de la acción
    console.print(f"\n[italic]{tirada.get('accion_descripcion', '')}[/italic]")
    
    # Calcular modificador basado en stats
    stat_principal = tirada.get("stat_principal")
    modificador = 0
    
    if stat_principal and stat_principal in estado_juego["stats"]:
        # Convertir valor de stat (0-100) a modificador (-5 a +5)
        valor_stat = estado_juego["stats"][stat_principal]
        modificador = (valor_stat - 50) // 10
        
        console.print(f"Tu {stat_principal} te da un modificador de [bold]{modificador}[/bold]")
    
    # Realizar tirada
    dificultad = tirada.get("dificultad", 10)
    inverso = tirada.get("modificador_inverso", False)
    
    console.print(f"Dificultad: [bold]{dificultad}[/bold]")
    
    resultado = tirada_dados(dificultad, modificador, inverso)
    rango = determinar_rango(resultado)
    
    # Buscar resultado específico para ese rango
    if rango in tirada.get("resultados", {}):
        resultado_data = tirada["resultados"][rango]
        
        # Mostrar secuencia de diálogo
        mostrar_secuencia(resultado_data.get("secuencia", []))
        
        # Actualizar stats
        actualizar_stats(resultado_data.get("efectos_stats", {}))
        
        # Gestionar objetos
        añadir_objetos(resultado_data.get("objetos_ganados", []))
        perder_objetos(resultado_data.get("objetos_perdidos", []))
        
        # Retornar siguiente ruta
        return resultado_data.get("siguiente_ruta")
    
    return None

# Mostrar opciones y obtener selección
def mostrar_opciones(opciones):
    if not opciones:
        return None
    
    console.print("\n[bold yellow]¿Qué quieres hacer?[/bold yellow]")
    
    for i, opcion in enumerate(opciones, 1):
        console.print(f"[green]{i}. {opcion.get('texto', 'Sin texto')}[/green]")
    
    # Opciones adicionales del sistema
    console.print("[dim]s. Ver estadísticas[/dim]")
    console.print("[dim]i. Ver inventario[/dim]")
    console.print("[dim]q. Salir del juego[/dim]")
    
    while True:
        seleccion = input("\nElige una opción: ").strip().lower()
        
        if seleccion == 's':
            mostrar_stats()
            continue
        elif seleccion == 'i':
            mostrar_inventario()
            continue
        elif seleccion == 'q':
            if Prompt.ask("¿Seguro que quieres salir?", choices=["s", "n"]) == "s":
                sys.exit(0)
            continue
        
        try:
            indice = int(seleccion) - 1
            if 0 <= indice < len(opciones):
                return opciones[indice].get("siguiente_ruta")
            else:
                console.print("[bold red]Opción no válida[/bold red]")
        except ValueError:
            console.print("[bold red]Por favor, introduce un número o una letra válida[/bold red]")

# Procesar una ruta
def procesar_ruta(ruta_id):
    # Buscar la ruta
    ruta = buscar_ruta(ruta_id)
    if not ruta:
        console.print(f"[bold red]Error: Ruta '{ruta_id}' no encontrada[/bold red]")
        return None
    
    # Limpiar pantalla
    limpiar_pantalla()
    
    # Mostrar título de la ruta
    console.print(f"\n[bold magenta]===== {ruta.get('nombre', 'Sin nombre')} =====[/bold magenta]")
    
    # Registrar ruta visitada
    if ruta_id not in estado_juego["rutas_visitadas"]:
        estado_juego["rutas_visitadas"].append(ruta_id)
    
    # Mostrar escenario
    mostrar_escenario(ruta)
    
    # Determinar tipo de contenido
    tipo_contenido = ruta.get("dialogo_tipo")
    id_contenido = ruta.get("dialogo_id")
    
    if tipo_contenido == "tiradas":
        # Cargar y procesar tirada
        tirada = cargar_tirada(ruta.get("tirada_categoria", "general"), id_contenido)
        return procesar_tirada(tirada)
    else:
        # Cargar diálogo
        dialogo = cargar_dialogo(tipo_contenido, id_contenido)
        if not dialogo:
            console.print(f"[bold red]Error: Diálogo '{id_contenido}' no encontrado[/bold red]")
            return None
        
        # Mostrar secuencia
        mostrar_secuencia(dialogo.get("secuencia", []))
        
        # Mostrar opciones y obtener siguiente ruta
        return mostrar_opciones(dialogo.get("opciones", []))

# Limpiar la pantalla
def limpiar_pantalla():
    if os.name == 'nt':  # para Windows
        os.system('cls')
    else:  # para Mac y Linux
        os.system('clear')

# Inicializar el juego
def inicializar_juego():
    # Verificar estructura de carpetas
    carpetas = [
        CARPETA_BASE,
        os.path.join(CARPETA_BASE, CARPETA_TIRADAS),
        os.path.join(CARPETA_BASE, CARPETA_DIALOGOS),
        os.path.join(CARPETA_BASE, CARPETA_RELLENO)
    ]
    
    for carpeta in carpetas:
        if not os.path.exists(carpeta):
            console.print(f"[yellow]Creando carpeta: {carpeta}[/yellow]")
            os.makedirs(carpeta, exist_ok=True)
    
    # Verificar archivo de rutas
    ruta_archivo = os.path.join(CARPETA_BASE, ARCHIVO_RUTAS)
    if not os.path.exists(ruta_archivo):
        console.print(f"[bold red]Error: No se encontró el archivo de rutas en {ruta_archivo}[/bold red]")
        console.print("Por favor, asegúrate de que el archivo existe antes de iniciar el juego.")
        sys.exit(1)

# Función principal
def main():
    console.print("[bold]===== CALABOZOS Y BABOSOS =====[/bold]")
    console.print("[italic]Una aventura viscosa[/italic]\n")
    
    # Inicializar juego
    inicializar_juego()
    
    # Comenzar con la primera ruta
    rutas = cargar_json(os.path.join(CARPETA_BASE, ARCHIVO_RUTAS))
    if not rutas or not rutas.get("rutas"):
        console.print("[bold red]Error: No se encontraron rutas definidas[/bold red]")
        sys.exit(1)
    
    ruta_actual = rutas["rutas"][0]["id"]
    
    # Bucle principal
    while ruta_actual:
        ruta_siguiente = procesar_ruta(ruta_actual)
        if ruta_siguiente:
            ruta_actual = ruta_siguiente
        else:
            # Si no hay siguiente ruta, preguntar si quiere reiniciar
            console.print("\n[bold yellow]Fin del camino.[/bold yellow]")
            respuesta = Prompt.ask("¿Deseas reiniciar el juego?", choices=["s", "n"])
            if respuesta.lower() == "s":
                # Reiniciar el juego
                estado_juego["stats"] = {
                    "Ganas de vivir": 100,
                    "Hambre intensa": 0,
                    "Pipí acumulado": 0,
                    "Miedo": 0,
                    "Reputación": 50
                }
                estado_juego["inventario"] = []
                estado_juego["rutas_visitadas"] = []
                estado_juego["habilidades"] = []
                
                ruta_actual = rutas["rutas"][0]["id"]
            else:
                break
    
    console.print("\n[bold]Gracias por jugar CALABOZOS Y BABOSOS[/bold]")

if __name__ == "__main__":
    main()
