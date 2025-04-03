################################################################################
# CALABOZOS Y BABOSOS - PARTE 1: IMPORTACIONES, CONFIGURACIÓN Y ESTADO DEL JUEGO
################################################################################
# 
# Este código implementa un juego de texto basado en historias interactivas y
# tiradas de dados, al estilo de juegos de rol de mesa.
# 
# El juego funciona cargando datos desde archivos JSON que contienen:
# - Rutas: Definen la estructura de navegación del juego
# - Diálogos: Contienen las conversaciones entre personajes
# - Tiradas: Definen pruebas basadas en dados que el jugador debe superar
# - Relleno: Fragmentos de texto reutilizables
#
# El usuario avanza a través de diferentes escenarios, toma decisiones mediante
# opciones y realiza tiradas para determinar el resultado de sus acciones.
#
# La interfaz usa la biblioteca Rich para mostrar texto formateado en la terminal.
################################################################################

# Importar bibliotecas necesarias
import json  # Para cargar y manipular archivos JSON
import os  # Para interactuar con el sistema operativo (rutas, limpiar pantalla)
import sys  # Para funciones del sistema como salir del programa
import random  # Para generar números aleatorios (tiradas de dados)
import re  # Para expresiones regulares (buscar patrones en textos)

# Importar componentes de la biblioteca Rich para interfaz de texto mejorada
from rich.console import Console  # Consola principal para mostrar texto formateado
from rich.text import Text  # Para dar formato a textos individuales
from rich.panel import Panel  # Para crear paneles/recuadros con texto
from rich.layout import Layout  # Para organizar elementos en la pantalla
from rich.table import Table  # Para mostrar datos en formato de tabla
from rich.prompt import Prompt  # Para solicitar entrada al usuario con formato

# Configuración de rutas para los archivos del juego
# Actualizadas para usar los archivos JSON completos
ARCHIVO_RUTAS = "rutas_completo.json"
ARCHIVO_DIALOGOS = "historia_completo.json"
ARCHIVO_TIRADAS = "combate_completo.json"
ARCHIVO_RELLENO = "relleno_completo.json"

# Inicialización de la consola principal para la interfaz
console = Console()  # Crea un objeto Console para mostrar texto formateado

# Estructura de diccionario para mantener el estado del juego
estado_juego = {
    "stats": {  # Estadísticas del personaje jugador
        "ganas_de_vivir": 100,  # Puntos de vida/motivación del personaje
        "hambre_intensa": 0,  # Nivel de hambre (afecta negativamente si aumenta)
        "pipi_acumulado": 0,  # Necesidad de ir al baño (afecta negativamente si aumenta)
        "miedo": 0,  # Nivel de miedo (afecta negativamente si aumenta)
        "reputacion": 50  # Cómo te ven otros personajes (valor medio)
    },
    "inventario": [],  # Lista para almacenar objetos que el jugador recoge
    "rutas_visitadas": [],  # Registro de escenas/rutas que el jugador ha visitado
    "habilidades": []  # Lista de habilidades especiales que el jugador desbloquea
}

# Almacenamiento global para los datos cargados
datos_rutas = None
datos_dialogos = None
datos_tiradas = None
datos_relleno = None

# Función para imprimir mensajes de depuración con formato especial
def debug_log(mensaje):
    # Muestra un mensaje con fondo blanco y texto azul para ayudar al desarrollo
    console.print(f"[bold blue on white]DEBUG: {mensaje}[/bold blue on white]")


################################################################################
# CALABOZOS Y BABOSOS - PARTE 2: FUNCIONES DE CARGA DE ARCHIVOS Y DATOS
################################################################################
# 
# En esta sección están las funciones que cargan información desde
# los archivos JSON. Son importantes porque todo el contenido del juego
# está en esos archivos.
################################################################################

# Cargar un archivo JSON - Esta función es la base para cargar cualquier dato
def cargar_json(ruta_archivo):
    debug_log(f"Intentando cargar archivo: {ruta_archivo}")
    try:
        # Intenta abrir y leer el archivo con codificación UTF-8 (para caracteres especiales)
        with open(ruta_archivo, 'r', encoding='utf-8') as archivo:
            datos = json.load(archivo)  # Convierte el JSON en un diccionario de Python
            debug_log(f"Archivo cargado correctamente: {ruta_archivo}")
            return datos
    except FileNotFoundError:
        # Si el archivo no existe, muestra un error en rojo
        console.print(f"[bold red]Error: No se encontró el archivo {ruta_archivo}[/bold red]")
        return None
    except json.JSONDecodeError:
        # Si el archivo existe pero no es un JSON válido, muestra un error
        console.print(f"[bold red]Error: El archivo {ruta_archivo} no contiene JSON válido[/bold red]")
        return None

# Cargar todos los archivos de datos necesarios para el juego
def cargar_todos_datos():
    global datos_rutas, datos_dialogos, datos_tiradas, datos_relleno
    
    datos_rutas = cargar_json(ARCHIVO_RUTAS)
    datos_dialogos = cargar_json(ARCHIVO_DIALOGOS)
    datos_tiradas = cargar_json(ARCHIVO_TIRADAS)
    datos_relleno = cargar_json(ARCHIVO_RELLENO)
    
    if not datos_rutas or not datos_dialogos or not datos_tiradas or not datos_relleno:
        console.print("[bold red]Error: No se pudieron cargar todos los archivos necesarios[/bold red]")
        sys.exit(1)

# Buscar una ruta específica por su ID
def buscar_ruta(ruta_id):
    debug_log(f"Buscando ruta con ID: {ruta_id}")
    
    # Busca la ruta específica por su ID
    for ruta in datos_rutas.get("rutas", []):
        if ruta.get("id") == ruta_id:
            debug_log(f"Ruta encontrada: {ruta_id} - Nombre: {ruta.get('nombre', 'Sin nombre')}")
            return ruta
    
    # Si no encuentra la ruta, registra y devuelve None
    debug_log(f"Ruta no encontrada: {ruta_id}")
    return None

# Cargar un diálogo específico
def cargar_dialogo(id_dialogo):
    debug_log(f"Cargando diálogo con ID: {id_dialogo}")
    
    # Busca el diálogo específico por su ID
    for dialogo in datos_dialogos.get("dialogos", []):
        if dialogo.get("id") == id_dialogo:
            debug_log(f"Diálogo encontrado: {id_dialogo}")
            return dialogo
    
    # Si no encuentra el diálogo, registra y devuelve None
    debug_log(f"Diálogo no encontrado: {id_dialogo}")
    return None

# Cargar una tirada específica
def cargar_tirada(id_tirada):
    debug_log(f"Cargando tirada con ID: {id_tirada}")
    
    # Busca la tirada específica por su ID
    for tirada in datos_tiradas.get("tiradas", []):
        if tirada.get("id") == id_tirada:
            debug_log(f"Tirada encontrada: {id_tirada}")
            return tirada
    
    # Si no encuentra la tirada, registra y devuelve None
    debug_log(f"Tirada no encontrada: {id_tirada}")
    return None

# Cargar un fragmento de texto reutilizable
def cargar_relleno(id_relleno):
    debug_log(f"Cargando fragmento de relleno: {id_relleno}")
    
    # Busca el fragmento específico por su ID
    for relleno in datos_relleno.get("fragmentos", []):
        if relleno.get("id") == id_relleno:
            debug_log(f"Fragmento de relleno encontrado: {id_relleno}")
            return relleno.get("texto", "")
    
    # Si no encuentra el fragmento, registra y devuelve texto vacío
    debug_log(f"Fragmento de relleno no encontrado: {id_relleno}")
    return ""

# Resolver referencias a fragmentos de relleno dentro de un texto
def resolver_referencias(texto):
    # Busca patrones como ${relleno:id_del_fragmento} en el texto
    patron = r'\${([^:]+):([^}]+)}'
    
    # Función que se ejecuta por cada coincidencia encontrada
    def reemplazar(coincidencia):
        tipo = coincidencia.group(1)  # Obtiene el tipo de referencia (ej: "relleno")
        id_ref = coincidencia.group(2)  # Obtiene el ID del fragmento
        
        debug_log(f"Resolviendo referencia - Tipo: {tipo}, ID: {id_ref}")
        
        # Actualmente solo soporta referencias de tipo "relleno"
        if tipo == "relleno":
            return cargar_relleno(id_ref)  # Reemplaza por el texto del fragmento
        else:
            return f"[ERROR: Referencia no encontrada {tipo}:{id_ref}]"
    
    # Aplica la función reemplazar a todas las coincidencias encontradas
    return re.sub(patron, reemplazar, texto)

################################################################################
# CALABOZOS Y BABOSOS - PARTE 3: FUNCIONES DE MECÁNICAS DE JUEGO (TIRADAS, DADOS)
################################################################################
# 
# Aquí están las mecánicas principales del juego, especialmente las tiradas de dados 
# que dan ese elemento de azar y estrategia.
#
# El juego usa un sistema inspirado en D&D donde tiras un dado de 20 caras (D20)
# y según el resultado y tus estadísticas, determina si tienes éxito o no en
# diferentes acciones.
################################################################################

# Función para realizar una tirada de dados
def tirada_dados(dificultad=10, modificador=0, inverso=False):
    # Simular tirada de D20 (dado de 20 caras)
    resultado = random.randint(1, 20)  # Genera un número aleatorio entre 1 y 20
    resultado_modificado = resultado + modificador  # Suma el modificador al resultado
    
    debug_log(f"Tirada de dados - Base: {resultado}, Modificador: {modificador}")
    
    # Si es inverso, un modificador negativo ayuda (como en el caso del Miedo)
    if inverso:
        resultado_modificado = resultado - modificador
    
    # Mostrar animación de dados (muestra números aleatorios rápidamente)
    console.print("\n[bold cyan]Tirando dados...[/bold cyan]")
    for i in range(3):  # Muestra 3 números aleatorios antes del resultado final
        console.print(f"[dim]{random.randint(1, 20)}...[/dim]", end="\r")
        import time
        time.sleep(0.3)  # Pausa por 0.3 segundos para crear efecto de animación
    
    # Mostrar resultado final con formato según sea crítico o pifia
    if resultado == 20:
        # ¡Crítico! El mejor resultado posible (20 natural en el dado)
        console.print(f"[bold green]¡CRÍTICO! Resultado: {resultado}[/bold green]")
    elif resultado == 1:
        # ¡Pifia! El peor resultado posible (1 natural en el dado)
        console.print(f"[bold red]¡PIFIA! Resultado: {resultado}[/bold red]")
    else:
        # Resultado normal, color verde si supera la dificultad, rojo si no
        color = "green" if resultado_modificado >= dificultad else "red"
        console.print(f"[{color}]Resultado: {resultado} (+ {modificador} = {resultado_modificado})[/{color}]")
    
    debug_log(f"Resultado final de la tirada: {resultado_modificado}")
    return resultado  # Retorna el resultado sin modificar - esto es importante

# Encontrar el resultado adecuado para una tirada según el valor obtenido
def encontrar_resultado_tirada(tirada_info, valor_resultado):
    # Busca en los resultados de la tirada el rango que incluye el valor obtenido
    for resultado in tirada_info.get("resultados", []):
        rango = resultado.get("rango", [0, 0])
        if rango[0] <= valor_resultado <= rango[1]:
            return resultado
    
    debug_log(f"No se encontró resultado para el valor {valor_resultado}")
    return None

# Procesar una tirada y mostrar el resultado
def procesar_tirada(id_tirada):
    # Cargar la información de la tirada
    tirada = cargar_tirada(id_tirada)
    if not tirada:
        console.print(f"[bold red]Error: Tirada '{id_tirada}' no encontrada[/bold red]")
        return None
    
    debug_log(f"Procesando tirada: {id_tirada}")
    
    # Obtener información importante de la tirada
    stat = tirada.get("stat", "reputacion")
    dificultad = tirada.get("dificultad", 10)
    inverso = tirada.get("inverso", False)
    condicion = tirada.get("condicion", None)
    
    # Calcular modificador basado en el stat del personaje
    modificador = 0
    if stat in estado_juego["stats"]:
        # Convierte valor de stat (0-100) a modificador (-5 a +5)
        valor_stat = estado_juego["stats"][stat]
        modificador = (valor_stat - 50) // 10
        
        debug_log(f"Stat: {stat}, Valor: {valor_stat}, Modificador: {modificador}")
        console.print(f"Tu {stat} te da un modificador de [bold]{modificador}[/bold]")
    
    # Verificar condición especial si existe
    if condicion:
        console.print(f"[yellow]Condición especial: {condicion}[/yellow]")
        # Aquí podrías implementar la lógica para verificar condiciones como "tiene_sal"
        # Por simplicidad, asumimos que la condición se cumple
    
    # Mostrar descripción e información de la tirada
    console.print(f"\n[italic]Realizando prueba de {stat.upper()}[/italic]")
    console.print(f"Dificultad: [bold]{dificultad}[/bold]")
    
    # Realizar la tirada
    resultado = tirada_dados(dificultad, modificador, inverso)
    
    # Buscar el resultado correspondiente
    resultado_info = encontrar_resultado_tirada(tirada, resultado)
    if not resultado_info:
        console.print("[bold red]Error: No se pudo determinar el resultado[/bold red]")
        return None
    
    # Mostrar el texto del resultado
    console.print(f"\n[bold cyan]Resultado:[/bold cyan]")
    console.print(resultado_info.get("texto", "Sin descripción"))
    
    # Mostrar respuesta NPC si existe
    if "respuesta_npc" in resultado_info:
        console.print(f"\n[bold yellow]NPC:[/bold yellow] {resultado_info['respuesta_npc']}")
    
    # Aplicar efectos si existen
    if "efectos" in resultado_info:
        efectos = resultado_info["efectos"]
        # Actualizar stats
        for stat, valor in efectos.items():
            if stat in estado_juego["stats"]:
                estado_juego["stats"][stat] += valor
                color = "green" if valor > 0 else "red"
                console.print(f"[{color}]Tu {stat} ha cambiado en {valor}[/{color}]")
        
        # Añadir objetos al inventario
        if "objetos" in efectos:
            for objeto in efectos["objetos"]:
                estado_juego["inventario"].append(objeto)
                console.print(f"[green]Has obtenido: {objeto}[/green]")
    
    input("\nPresiona Enter para continuar...")
    
    # En un juego completo, aquí determinarías la siguiente ruta
    # Por ahora, simplemente continuamos con las conexiones de la ruta actual
    return True

################################################################################
# CALABOZOS Y BABOSOS - PARTE 4: FUNCIONES DE GESTIÓN DE INVENTARIO Y ESTADÍSTICAS
################################################################################
# 
# Estas funciones manejan cómo cambian las estadísticas del personaje
# y cómo se gestionan los objetos en el inventario.
################################################################################

# Mostrar estadísticas del jugador
def mostrar_stats():
    debug_log("Mostrando estadísticas del jugador")
    
    # Crea una tabla bonita para mostrar las estadísticas
    tabla = Table(title="Estadísticas")
    tabla.add_column("Stat", style="cyan")
    tabla.add_column("Valor", style="green")
    
    # Para cada estadística, añade una fila a la tabla con color según su valor
    for stat, valor in estado_juego["stats"].items():
        # Colorea los stats según su valor
        color = "green"
        if valor < 30:
            color = "red"
        elif valor < 60:
            color = "yellow"
        
        tabla.add_row(stat, f"[{color}]{valor}[/{color}]")
    
    # Muestra la tabla en la consola
    console.print(tabla)
    input("\nPresiona Enter para continuar...")

# Mostrar inventario
def mostrar_inventario():
    debug_log("Mostrando inventario del jugador")
    
    # Si el inventario está vacío, muestra un mensaje
    if not estado_juego["inventario"]:
        console.print("[yellow]Tu inventario está vacío.[/yellow]")
        input("\nPresiona Enter para continuar...")
        return
    
    # Crea una tabla bonita para mostrar el inventario
    tabla = Table(title="Inventario")
    tabla.add_column("Objeto", style="cyan")
    
    # Para cada objeto, añade una fila a la tabla
    for objeto in estado_juego["inventario"]:
        tabla.add_row(objeto)
    
    # Muestra la tabla en la consola
    console.print(tabla)
    input("\nPresiona Enter para continuar...")

################################################################################
# CALABOZOS Y BABOSOS - PARTE 5: FUNCIONES DE INTERFAZ Y MOSTRADO DE INFORMACIÓN
################################################################################
# 
# Estas funciones controlan todo lo que ve el jugador en pantalla.
################################################################################

# Mostrar escenario actual
def mostrar_escenario(ruta):
    # Obtener ID del escenario
    escenario_id = ruta.get("escenario")
    if not escenario_id:
        debug_log("Ruta sin escenario definido")
        return
    
    debug_log(f"Mostrando escenario: {ruta.get('nombre', 'Sin nombre')}")
    
    # Buscar descripción del escenario en fragmentos de relleno
    descripcion_id = f"descripcion_{escenario_id}"
    descripcion = cargar_relleno(descripcion_id)
    
    if not descripcion:
        descripcion = f"Te encuentras en {ruta.get('nombre', 'un lugar desconocido')}."
    
    # Crea un panel con borde coloreado para mostrar la descripción del escenario
    panel = Panel(
        Text(descripcion, style="bold white"),
        title=f"[bold]{ruta.get('nombre', 'ESCENARIO')}[/bold]",
        border_style="blue"
    )
    console.print(panel)

# Mostrar opciones y obtener selección del jugador
def mostrar_opciones(opciones):
    if not opciones:
        debug_log("No hay opciones disponibles")
        return None
    
    debug_log(f"Mostrando {len(opciones)} opciones")
    
    # Muestra el título para las opciones
    console.print("\n[bold yellow]¿Qué quieres hacer?[/bold yellow]")
    
    # Muestra cada opción numerada
    for i, opcion in enumerate(opciones, 1):
        console.print(f"[green]{i}. {opcion.get('texto', 'Sin texto')}[/green]")
        debug_log(f"Opción {i}: {opcion.get('texto')} -> {opcion.get('siguiente_ruta', 'Sin ruta')}")
    
    # Opciones adicionales del sistema (siempre disponibles)
    console.print("[dim]s. Ver estadísticas[/dim]")
    console.print("[dim]i. Ver inventario[/dim]")
    console.print("[dim]q. Salir del juego[/dim]")
    
    # Bucle para obtener una selección válida
    while True:
        seleccion = input("\nElige una opción: ").strip().lower()
        debug_log(f"Selección del usuario: {seleccion}")
        
        # Procesa opciones del sistema
        if seleccion == 's':
            mostrar_stats()  # Muestra estadísticas
            continue  # Vuelve a pedir selección
        elif seleccion == 'i':
            mostrar_inventario()  # Muestra inventario
            continue  # Vuelve a pedir selección
        elif seleccion == 'q':
            # Confirmación antes de salir
            if Prompt.ask("¿Seguro que quieres salir?", choices=["s", "n"]) == "s":
                sys.exit(0)  # Sale del programa
            continue  # Si no confirma, vuelve a pedir selección
        
        # Procesa selección numérica (opciones de la historia)
        try:
            indice = int(seleccion) - 1  # Convierte a índice (0-based)
            if 0 <= indice < len(opciones):
                siguiente_ruta = opciones[indice].get("siguiente_ruta")
                debug_log(f"Seleccionada opción {indice+1}, siguiente ruta: {siguiente_ruta}")
                return siguiente_ruta
            else:
                console.print("[bold red]Opción no válida[/bold red]")
        except ValueError:
            console.print("[bold red]Por favor, introduce un número o una letra válida[/bold red]")

# Mostrar secuencia de diálogos
def mostrar_secuencia(secuencia):
    if not secuencia:
        debug_log("No hay secuencia de diálogo para mostrar")
        return
    
    debug_log(f"Mostrando secuencia de diálogo con {len(secuencia)} líneas")
    
    ultimo_personaje = None
    
    # Para cada fragmento de diálogo en la secuencia
    for i, dialogo in enumerate(secuencia):
        personaje = dialogo.get("personaje", "???")
        texto_original = dialogo.get("texto", "...")
        
        debug_log(f"Diálogo {i+1}/{len(secuencia)} - Personaje: {personaje}")
        
        # Resolver referencias a textos dinámicos
        texto = resolver_referencias(texto_original)
        
        # Crear texto enriquecido con colores según el personaje
        estilo_personaje = "bold cyan"  # Estilo predeterminado
        if personaje == "NARRADOR":
            estilo_personaje = "bold yellow"
        elif "GUARDIA" in personaje:
            estilo_personaje = "bold red"
        
        # Construye el texto con el nombre del personaje y su diálogo
        rich_text = Text(f"\n{personaje}: ", style=estilo_personaje)
        rich_text.append(texto, style="white")
        
        # Muestra el diálogo en pantalla
        console.print(rich_text)
        
        # Si hay pausa explícita, esperar input del usuario
        if dialogo.get("pausa", False):
            input("\nPresiona Enter para continuar...")

# Limpiar la pantalla
def limpiar_pantalla():
    debug_log("Limpiando pantalla")
    if os.name == 'nt':  # para Windows
        os.system('cls')
    else:  # para Mac y Linux
        os.system('clear')

################################################################################
# CALABOZOS Y BABOSOS - PARTE 6: FUNCIONES PRINCIPALES DEL FLUJO DEL JUEGO
################################################################################
# 
# Estas funciones controlan todo el flujo y la lógica principal.
################################################################################

# Procesar una ruta (una "escena" del juego)
def procesar_ruta(ruta_id):
    debug_log(f"========== PROCESANDO RUTA: {ruta_id} ==========")
    
    # Buscar la ruta en los datos
    ruta = buscar_ruta(ruta_id)
    if not ruta:
        console.print(f"[bold red]Error: Ruta '{ruta_id}' no encontrada[/bold red]")
        return None
    
    # Limpiar pantalla para la nueva escena
    limpiar_pantalla()
    
    # Mostrar título de la ruta actual
    console.print(f"\n[bold magenta]===== {ruta.get('nombre', 'Sin nombre')} =====[/bold magenta]")
    
    # Registrar que hemos visitado esta ruta (para seguimiento)
    if ruta_id not in estado_juego["rutas_visitadas"]:
        estado_juego["rutas_visitadas"].append(ruta_id)
        debug_log(f"Ruta {ruta_id} añadida a rutas visitadas")
    
    # Mostrar el escenario (descripción, elementos, ambiente)
    mostrar_escenario(ruta)
    
    # Verificar si es una ruta con tirada de dados
    if "tirada" in ruta:
        # Es una tirada de dados (desafío aleatorio)
        debug_log(f"Procesando tirada para ruta: {ruta_id}")
        procesar_tirada(ruta_id)
    
    # Cargar y mostrar diálogo asociado al escenario
    dialogo = cargar_dialogo(ruta.get("escenario", ""))
    if dialogo:
        mostrar_secuencia(dialogo.get("secuencia", []))
        siguiente_ruta = mostrar_opciones(dialogo.get("opciones", []))
        debug_log(f"Siguiente ruta seleccionada: {siguiente_ruta}")
        return siguiente_ruta
    else:
        # Si no hay diálogo, mostrar opciones de conexión directa
        conexiones = ruta.get("conexiones", [])
        if conexiones:
            # Crear opciones a partir de las conexiones
            opciones = []
            for conexion in conexiones:
                ruta_conexion = buscar_ruta(conexion)
                if ruta_conexion:
                    opciones.append({
                        "texto": f"Ir a {ruta_conexion.get('nombre', conexion)}",
                        "siguiente_ruta": conexion
                    })
            
            siguiente_ruta = mostrar_opciones(opciones)
            debug_log(f"Siguiente ruta seleccionada desde conexiones: {siguiente_ruta}")
            return siguiente_ruta
    
    # Si llegamos aquí, no hay forma de continuar
    console.print("[yellow]No hay opciones disponibles para continuar.[/yellow]")
    return None

# Inicializar el juego
def inicializar_juego():
    debug_log("Inicializando juego")
    
    # Verificar que existen los archivos necesarios
    archivos = [ARCHIVO_RUTAS, ARCHIVO_DIALOGOS, ARCHIVO_TIRADAS, ARCHIVO_RELLENO]
    for archivo in archivos:
        if not os.path.exists(archivo):
            console.print(f"[bold red]Error: No se encontró el archivo {archivo}[/bold red]")
            console.print("Por favor, asegúrate de que el archivo existe antes de iniciar el juego.")
            return False
    
    # Cargar todos los datos del juego
    cargar_todos_datos()
    return True

# Función principal que inicia todo
def main():
    console.print("[bold]===== CALABOZOS Y BABOSOS =====[/bold]")
    console.print("[italic]Una aventura viscosa[/italic]\n")
    console.print("[bold blue on white]MODO DEBUG ACTIVADO: Se mostrarán los IDs y el flujo de ejecución[/bold blue on white]")
    
    # Preparar el juego
    if not inicializar_juego():
        sys.exit(1)
    
    # Comenzar con la primera ruta definida
    if not datos_rutas or not datos_rutas.get("rutas"):
        console.print("[bold red]Error: No se encontraron rutas definidas[/bold red]")
        sys.exit(1)
    
    ruta_actual = datos_rutas["rutas"][0]["id"]
    debug_log(f"Ruta inicial: {ruta_actual}")
    
    # BUCLE PRINCIPAL DEL JUEGO
    while ruta_actual:
        # Procesar la ruta actual y obtener la siguiente
        ruta_siguiente = procesar_ruta(ruta_actual)
        if ruta_siguiente:
            debug_log(f"Transición de ruta: {ruta_actual} -> {ruta_siguiente}")
            ruta_actual = ruta_siguiente
        else:
            # Si no hay siguiente ruta, hemos llegado al final de este camino
            debug_log("Fin de ruta alcanzado sin siguiente ruta definida")
            console.print("\n[bold yellow]Fin del camino.[/bold yellow]")
            
            # Preguntar si quiere reiniciar
            respuesta = Prompt.ask("¿Deseas reiniciar el juego?", choices=["s", "n"])
            if respuesta.lower() == "s":
                # Reiniciar el estado del juego
                debug_log("Reiniciando juego")
                estado_juego["stats"] = {
                    "ganas_de_vivir": 100,
                    "hambre_intensa": 0,
                    "pipi_acumulado": 0,
                    "miedo": 0,
                    "reputacion": 50
                }
                estado_juego["inventario"] = []
                estado_juego["rutas_visitadas"] = []
                estado_juego["habilidades"] = []
                
                # Volver a la ruta inicial
                ruta_actual = datos_rutas["rutas"][0]["id"]
                debug_log(f"Juego reiniciado, ruta inicial: {ruta_actual}")
            else:
                debug_log("Jugador eligió no reiniciar, terminando juego")
                break
    
    # Mensaje de despedida
    console.print("\n[bold]Gracias por jugar CALABOZOS Y BABOSOS[/bold]")

# Punto de entrada principal
if __name__ == "__main__":
    main()