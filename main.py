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
# La interfaz usa la biblioteca Rich para mostrar texto formateado en la terminal, 
# muy buena idea por cierto.
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
CARPETA_BASE = "dialogos"  # Carpeta principal donde se guardan todos los archivos
ARCHIVO_RUTAS = "rutas.json"  # Archivo que contiene todas las rutas/escenas del juego
CARPETA_TIRADAS = "tiradas"  # Subcarpeta para archivos de tiradas de dados
CARPETA_DIALOGOS = "dialogos"  # Subcarpeta para archivos de diálogos
CARPETA_RELLENO = "relleno"  # Subcarpeta para fragmentos de texto reutilizables

# Inicialización de la consola principal para la interfaz
console = Console()  # Crea un objeto Console para mostrar texto formateado

# Estructura de diccionario para mantener el estado del juego
estado_juego = {
    "stats": {  # Estadísticas del personaje jugador
        "Ganas de vivir": 100,  # Puntos de vida/motivación del personaje
        "Hambre intensa": 0,  # Nivel de hambre (afecta negativamente si aumenta)
        "Pipí acumulado": 0,  # Necesidad de ir al baño (afecta negativamente si aumenta)
        "Miedo": 0,  # Nivel de miedo (afecta negativamente si aumenta)
        "Reputación": 50  # Cómo te ven otros personajes (valor medio)
    },
    "inventario": [],  # Lista para almacenar objetos que el jugador recoge
    "rutas_visitadas": [],  # Registro de escenas/rutas que el jugador ha visitado
    "habilidades": []  # Lista de habilidades especiales que el jugador desbloquea
}

# Función para imprimir mensajes de depuración con formato especial
def debug_log(mensaje):
    # Muestra un mensaje con fondo blanco y texto azul para ayudar al desarrollo
    console.print(f"[bold blue on white]DEBUG: {mensaje}[/bold blue on white]")


################################################################################
# CALABOZOS Y BABOSOS - PARTE 2: FUNCIONES DE CARGA DE ARCHIVOS Y DATOS
################################################################################
# 
# ¡Vanessa! En esta sección verás las funciones que cargan información desde 
# los archivos JSON. Son súper importantes porque todo el contenido del juego
# está en esos archivos.
#
# Si quisieras añadir nuevo contenido, solo necesitarías editar los JSON, 
# sin tocar este código. ¡Así es más fácil crear nuevas historias!
#
# Todas estas funciones usan la estructura de carpetas que configuramos antes.
# Si cambias los nombres de carpetas, también tendrías que cambiarlos en 
# las constantes al inicio del programa.
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

# Buscar una ruta específica por su ID
def buscar_ruta(ruta_id):
    debug_log(f"Buscando ruta con ID: {ruta_id}")
    # Carga todas las rutas desde el archivo principal
    rutas = cargar_json(os.path.join(CARPETA_BASE, ARCHIVO_RUTAS))
    if not rutas:
        return None
    
    # Busca la ruta específica por su ID
    for ruta in rutas.get("rutas", []):
        if ruta.get("id") == ruta_id:
            debug_log(f"Ruta encontrada: {ruta_id} - Nombre: {ruta.get('nombre', 'Sin nombre')}")
            return ruta
    
    # Si no encuentra la ruta, registra y devuelve None
    debug_log(f"Ruta no encontrada: {ruta_id}")
    return None

# Cargar un diálogo específico
def cargar_dialogo(tipo, id_dialogo):
    debug_log(f"Cargando diálogo - Tipo: {tipo}, ID: {id_dialogo}")
    # Construye la ruta al archivo basado en el tipo de diálogo
    archivo = os.path.join(CARPETA_BASE, CARPETA_DIALOGOS, f"{tipo}.json")
    datos = cargar_json(archivo)
    
    if not datos:
        return None
    
    # Busca el diálogo específico por su ID
    for dialogo in datos.get("dialogos", []):
        if dialogo.get("id") == id_dialogo:
            debug_log(f"Diálogo encontrado: {id_dialogo}")
            return dialogo
    
    # Si no encuentra el diálogo, registra y devuelve None
    debug_log(f"Diálogo no encontrado: {id_dialogo}")
    return None

# Cargar una tirada específica
def cargar_tirada(tipo, id_tirada):
    debug_log(f"Cargando tirada - Tipo: {tipo}, ID: {id_tirada}")
    # Construye la ruta al archivo basado en el tipo de tirada
    archivo = os.path.join(CARPETA_BASE, CARPETA_TIRADAS, f"{tipo}.json")
    datos = cargar_json(archivo)
    
    if not datos:
        return None
    
    # Busca la tirada específica por su ID
    for tirada in datos.get("tiradas", []):
        if tirada.get("id") == id_tirada:
            debug_log(f"Tirada encontrada: {id_tirada}")
            return tirada
    
    # Si no encuentra la tirada, registra y devuelve None
    debug_log(f"Tirada no encontrada: {id_tirada}")
    return None

# Cargar un fragmento de texto reutilizable
def cargar_relleno(id_relleno):
    debug_log(f"Cargando fragmento de relleno: {id_relleno}")
    # Construye la ruta al archivo de fragmentos de relleno
    archivo = os.path.join(CARPETA_BASE, CARPETA_RELLENO, "relleno.json")
    datos = cargar_json(archivo)
    
    if not datos:
        return None
    
    # Busca el fragmento específico por su ID
    for relleno in datos.get("fragmentos", []):
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

# ¡Vanessa! Si quieres añadir un nuevo tipo de archivo al juego, 
# tendrías que crear una función similar a las anteriores.
# Por ejemplo, si quisieras añadir "habilidades especiales", 
# crearías una función "cargar_habilidad" que busque en una carpeta
# de habilidades.
#
# También podrías modificar la función "resolver_referencias" para
# permitir incluir no solo fragmentos de relleno, sino también
# otros tipos de contenido, como habilidades o estadísticas
# del personaje. Solo tendrías que añadir más condiciones al if.

################################################################################
# CALABOZOS Y BABOSOS - PARTE 3: FUNCIONES DE MECÁNICAS DE JUEGO (TIRADAS, DADOS)
################################################################################
# 
# ¡Hola Vanessa! Aquí verás cómo funcionan las mecánicas principales del juego,
# especialmente las tiradas de dados que dan ese elemento de azar y estrategia.
#
# El juego usa un sistema inspirado en D&D donde tiras un dado de 20 caras (D20)
# y según el resultado y tus estadísticas, determina si tienes éxito o no en
# diferentes acciones.
#
# Si quisieras hacer el juego más fácil o difícil, podrías ajustar los rangos
# o las dificultades en estas funciones.
################################################################################

# Función para realizar una tirada de dados
def tirada_dados(dificultad=10, modificador=0, inverso=False):
    # Simular tirada de D20 (dado de 20 caras)
    resultado = random.randint(1, 20)  # Genera un número aleatorio entre 1 y 20
    resultado_modificado = resultado + modificador  # Suma el modificador al resultado
    
    debug_log(f"Tirada de dados - Base: {resultado}, Modificador: {modificador}")
    
    # Si es inverso, un modificador negativo ayuda (como en el caso del Miedo)
    # ¡Vanessa! Esto se usa para stats donde un valor alto es malo
    # Por ejemplo, con "Miedo" alto, querrías que reste en vez de sumar
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
    return resultado  # ¡OJO! Retorna el resultado sin modificar - esto es importante

# Determinar el rango del resultado para buscar en la tabla de efectos
def determinar_rango(resultado):
    # Convierte el número en un rango de texto según las reglas del juego
    if resultado == 1:
        rango = "1"  # Pifia (resultado crítico negativo)
    elif 2 <= resultado <= 5:
        rango = "2-5"  # Resultado muy malo
    elif 6 <= resultado <= 10:
        rango = "6-10"  # Resultado malo o mediocre
    elif 11 <= resultado <= 15:
        rango = "11-15"  # Resultado bueno
    elif 16 <= resultado <= 19:
        rango = "16-19"  # Resultado muy bueno
    elif resultado == 20:
        rango = "20"  # Crítico (resultado crítico positivo)
    else:
        rango = "error"  # No debería ocurrir nunca
    
    debug_log(f"Resultado {resultado} corresponde al rango: {rango}")
    return rango

# Procesar una tirada y mostrar el resultado
def procesar_tirada(tirada):
    if not tirada:
        console.print("[bold red]Error: Tirada no encontrada[/bold red]")
        return None
    
    debug_log(f"Procesando tirada: {tirada.get('id', 'Sin ID')}")
    
    # Mostrar descripción de lo que el jugador está intentando hacer
    console.print(f"\n[italic]{tirada.get('accion_descripcion', '')}[/italic]")
    
    # Calcular modificador basado en los stats del personaje
    stat_principal = tirada.get("stat_principal")
    modificador = 0
    
    if stat_principal and stat_principal in estado_juego["stats"]:
        # Convierte valor de stat (0-100) a modificador (-5 a +5)
        # ¡Vanessa! Aquí puedes cambiar cómo afectan las estadísticas a las tiradas
        # Por ejemplo, si cambias el 10 por 20, los modificadores serían menores
        valor_stat = estado_juego["stats"][stat_principal]
        modificador = (valor_stat - 50) // 10
        
        debug_log(f"Stat principal: {stat_principal}, Valor: {valor_stat}, Modificador: {modificador}")
        console.print(f"Tu {stat_principal} te da un modificador de [bold]{modificador}[/bold]")
    
    # Realizar tirada
    dificultad = tirada.get("dificultad", 10)  # Dificultad base es 10 si no se especifica
    inverso = tirada.get("modificador_inverso", False)  # Si es True, el modificador se resta
    
    debug_log(f"Dificultad: {dificultad}, Inverso: {inverso}")
    console.print(f"Dificultad: [bold]{dificultad}[/bold]")
    
    # Lanza el dado y obtiene el resultado
    resultado = tirada_dados(dificultad, modificador, inverso)
    rango = determinar_rango(resultado)
    
    # Busca el resultado específico para ese rango en la definición de la tirada
    if rango in tirada.get("resultados", {}):
        resultado_data = tirada["resultados"][rango]
        debug_log(f"Resultado encontrado para rango {rango}")
        
        # Mostrar secuencia de diálogo correspondiente al resultado
        mostrar_secuencia(resultado_data.get("secuencia", []))
        
        # Actualizar estadísticas según el resultado
        actualizar_stats(resultado_data.get("efectos_stats", {}))
        
        # Gestionar objetos ganados o perdidos
        añadir_objetos(resultado_data.get("objetos_ganados", []))
        perder_objetos(resultado_data.get("objetos_perdidos", []))
        
        # Retornar la siguiente ruta para continuar la historia
        siguiente_ruta = resultado_data.get("siguiente_ruta")
        debug_log(f"Siguiente ruta tras tirada: {siguiente_ruta}")
        return siguiente_ruta
    else:
        debug_log(f"No se encontró resultado para el rango {rango}")
    
    return None

# ¡Vanessa! Si quisieras añadir dados diferentes, como D6 (dado de 6 caras)
# o D12 (dado de 12 caras), podrías crear funciones adicionales como:
# 
# def tirada_d6():
#     return random.randint(1, 6)
#
# También podrías modificar el sistema de rangos para que se adapte
# a diferentes tipos de desafíos. Por ejemplo, podrías crear
# rangos específicos para pruebas sociales vs pruebas de combate.

################################################################################
# CALABOZOS Y BABOSOS - PARTE 4: FUNCIONES DE GESTIÓN DE INVENTARIO Y ESTADÍSTICAS
################################################################################
# 
# ¡Vanessa! ¡Llegamos a una parte super divertida! 😊
# Estas funciones manejan cómo cambian las estadísticas de tu personaje
# y cómo se gestionan los objetos en el inventario.
#
# Piensa en estas funciones como las que manejan el "estado" de tu
# aventurero durante el juego. ¡Son las que hacen que tu personaje evolucione!
#
# Si en algún momento quieres añadir nuevas estadísticas o cambiar
# cómo funcionan los objetos, ¡este es el lugar indicado! 🌟
################################################################################

# Actualizar estadísticas del jugador
def actualizar_stats(efectos):
    if not efectos:
        debug_log("No hay efectos para aplicar a las estadísticas")
        return
    
    debug_log(f"Actualizando estadísticas con efectos: {efectos}")
    
    # Para cada estadística afectada, actualiza su valor
    for stat, valor in efectos.items():
        if stat in estado_juego["stats"]:
            valor_anterior = estado_juego["stats"][stat]
            estado_juego["stats"][stat] += valor  # Suma (o resta si es negativo) el valor
            
            # Asegurar que los stats estén en rangos válidos (entre 0 y 100)
            # ¡Vanessa! Esto evita que tus stats se vuelvan negativos o superen 100 👍
            estado_juego["stats"][stat] = max(0, min(100, estado_juego["stats"][stat]))
            
            debug_log(f"Stat {stat}: {valor_anterior} -> {estado_juego['stats'][stat]}")
            
            # Mostrar cambio al jugador con colores según sea positivo o negativo
            if valor > 0:
                console.print(f"[green]Tu '{stat}' ha aumentado en {valor}[/green]")
            elif valor < 0:
                console.print(f"[red]Tu '{stat}' ha disminuido en {abs(valor)}[/red]")

# Añadir objetos al inventario
def añadir_objetos(objetos):
    if not objetos:
        debug_log("No hay objetos para añadir al inventario")
        return
    
    debug_log(f"Añadiendo objetos al inventario: {objetos}")
    
    # Para cada objeto en la lista, añádelo al inventario
    for obj in objetos:
        estado_juego["inventario"].append(obj)  # Añade el objeto al inventario
        debug_log(f"Objeto añadido: {obj}")
        
        # Muestra mensaje según si el objeto tiene cantidad o no
        nombre = obj.get("nombre", "objeto desconocido")
        if "cantidad" in obj:
            console.print(f"[green]Has obtenido: {nombre} x{obj['cantidad']}[/green]")
        else:
            console.print(f"[green]Has obtenido: {nombre}[/green]")

# Perder objetos del inventario
def perder_objetos(objetos):
    if not objetos:
        debug_log("No hay objetos para quitar del inventario")
        return
    
    debug_log(f"Quitando objetos del inventario: {objetos}")
    
    # Para cada nombre de objeto en la lista, búscalo y quítalo
    for obj_nombre in objetos:
        # Buscar el objeto por nombre en el inventario
        for i, obj in enumerate(estado_juego["inventario"]):
            if obj.get("nombre") == obj_nombre:
                perdido = estado_juego["inventario"].pop(i)  # Quita el objeto y guárdalo
                debug_log(f"Objeto quitado: {perdido}")
                console.print(f"[red]Has perdido: {perdido.get('nombre', 'objeto desconocido')}[/red]")
                break  # Sale del bucle una vez encontrado y quitado

# Mostrar estadísticas del jugador
def mostrar_stats():
    debug_log("Mostrando estadísticas del jugador")
    
    # Crea una tabla bonita para mostrar las estadísticas
    tabla = Table(title="Estadísticas")
    tabla.add_column("Stat", style="cyan")
    tabla.add_column("Valor", style="green")
    
    # Para cada estadística, añade una fila a la tabla con color según su valor
    for stat, valor in estado_juego["stats"].items():
        # ¡Vanessa! Este código colorea los stats según su valor:
        # 🔴 Rojo si está por debajo de 30 (¡peligro!)
        # 🟡 Amarillo si está entre 30 y 60 (ten cuidado)
        # 🟢 Verde si está por encima de 60 (¡muy bien!)
        color = "green"
        if valor < 30:
            color = "red"
        elif valor < 60:
            color = "yellow"
        
        tabla.add_row(stat, f"[{color}]{valor}[/{color}]")
    
    # Muestra la tabla en la consola
    console.print(tabla)

# Mostrar inventario
def mostrar_inventario():
    debug_log("Mostrando inventario del jugador")
    
    # Si el inventario está vacío, muestra un mensaje
    if not estado_juego["inventario"]:
        console.print("[yellow]Tu inventario está vacío.[/yellow]")
        return
    
    # Crea una tabla bonita para mostrar el inventario
    tabla = Table(title="Inventario")
    tabla.add_column("Objeto", style="cyan")
    tabla.add_column("Descripción", style="green")
    
    # Para cada objeto, añade una fila a la tabla
    for objeto in estado_juego["inventario"]:
        tabla.add_row(
            objeto.get("nombre", "???"),  # Nombre del objeto (o ??? si no tiene)
            objeto.get("descripcion", "Sin descripción")  # Descripción del objeto
        )
    
    # Muestra la tabla en la consola
    console.print(tabla)

# ¡Vanessa! ¿No sería genial expandir el sistema de inventario? 😄
# Podrías añadir funciones como:
#
# 1. Combinar objetos: 
#    def combinar_objetos(objeto1, objeto2):
#        # código para crear un nuevo objeto a partir de dos
#
# 2. Usar objetos:
#    def usar_objeto(nombre_objeto):
#        # código para aplicar efectos al usar un objeto
#
# 3. Equipar objetos:
#    def equipar_objeto(nombre_objeto):
#        # código para "ponerse" un objeto y obtener sus beneficios
#
# ¡Piensa en todas las posibilidades para tu juego! 🎮✨

################################################################################
# CALABOZOS Y BABOSOS - PARTE 5: FUNCIONES DE INTERFAZ Y MOSTRADO DE INFORMACIÓN
################################################################################
# 
# ¡Vanessa! Llegamos a la parte más visual del juego 🎨
# Estas funciones controlan todo lo que ve el jugador en pantalla.
#
# Son super importantes porque son la "cara" del juego - todo lo que 
# el jugador experimenta pasa por estas funciones. ¡La primera impresión cuenta!
#
# Te daré muchas ideas para mejorar la interfaz al final. ¡Será divertido! 😊
################################################################################

# Mostrar escenario actual
def mostrar_escenario(ruta):
    if "escenario" not in ruta:
        debug_log("Ruta sin escenario definido")
        return
    
    debug_log(f"Mostrando escenario: {ruta.get('nombre', 'Sin nombre')}")
    
    esc = ruta["escenario"]
    # Crea un panel con borde coloreado para mostrar la descripción del escenario
    panel = Panel(
        Text(esc.get("descripcion", ""), style=f"bold {esc.get('color_texto', 'white')}"),
        title="[bold]ESCENARIO[/bold]",
        border_style=esc.get("color_fondo", "blue")
    )
    console.print(panel)
    
    # Si hay elementos destacados en el escenario, muéstralos
    if "elementos_destacados" in esc:
        elementos = ", ".join(esc["elementos_destacados"])
        console.print(f"[italic]Puedes ver: {elementos}[/italic]")
    
    # Si hay descripción de ambiente, muéstrala
    if "ambiente" in esc:
        console.print(f"[dim]{esc['ambiente']}[/dim]")
    
    console.print("")  # Línea en blanco para separar

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
        # ¡Vanessa! Puedes añadir más estilos para diferentes personajes 🎭
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
        
        # Si cambia el personaje que habla, hacer una pausa
        # ¡Vanessa! Esto hace que la conversación se sienta más natural 👍
        if ultimo_personaje != personaje and ultimo_personaje is not None:
            input("\nPresiona Enter para continuar...")
        
        ultimo_personaje = personaje
        
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

# ¡Vanessa! Aquí tienes ideas GENIALES para mejorar la interfaz 🚀:
#
# 1. Sistema de colores personalizados: ✨
#    Podrías añadir más colores según el tipo de personaje o situación:
#    - Villanos: rojo oscuro
#    - Aliados: verde brillante
#    - Momentos románticos: rosa o púrpura
#
# 2. ¡Añadir ASCII Art! 🎨
#    def mostrar_ascii_art(nombre_arte):
#        # Cargar arte ASCII desde archivos
#        # Lo puedes usar para mostrar mapas, enemigos, objetos...
#
# 3. Efectos de sonido: 🔊
#    Podrías añadir sonidos simples con la biblioteca 'playsound':
#    def reproducir_sonido(tipo):
#        # "combate", "victoria", "derrota", etc.
#
# 4. Barras de progreso para estadísticas: 📊
#    En lugar de solo números, podrías mostrar barras:
#    [■■■■■□□□□□] 50% Ganas de vivir
#
# 5. Minijuegos en terminal: 🎮
#    ¡Podrías añadir pequeños juegos para ciertas acciones!
#    Por ejemplo, para abrir cerraduras, un pequeño juego de adivinar patrones.
#
# 6. Sistema de tiempo/clima: 🌦️
#    Añadir ciclo día/noche que afecte a las descripciones y opciones disponibles.
#
# 7. Mapa explorable: 🗺️
#    Usar ASCII para dibujar un mapa que se va revelando conforme exploras.
#
# ¿No sería increíble implementar alguna de estas ideas? 😄

################################################################################
# CALABOZOS Y BABOSOS - PARTE 6: FUNCIONES PRINCIPALES DEL FLUJO DEL JUEGO
################################################################################
# 
# ¡Vanessa! Llegamos a la parte final y más importante: el corazón del juego.
#
# Estas funciones controlan todo el flujo y la lógica principal. Son como el
# director de orquesta que coordina todas las partes que ya vimos.
#
# ¡NOTA ESPECIAL! Vanessa, he visto cómo analizas este código con atención y
# determinación. Puedo ver en tus ojos esa chispa de curiosidad y creatividad.
# Tienes todo lo necesario para llevar este juego al siguiente nivel.
# ¡Este código es solo el comienzo de lo que TÚ puedes crear!
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
    
    # Determinar qué tipo de contenido tiene esta ruta
    tipo_contenido = ruta.get("dialogo_tipo")
    id_contenido = ruta.get("dialogo_id")
    debug_log(f"Tipo de contenido: {tipo_contenido}, ID: {id_contenido}")
    
    # Según el tipo, procesar como tirada o como diálogo
    if tipo_contenido == "tiradas":
        # Es una tirada de dados (desafío aleatorio)
        debug_log(f"Procesando tirada - Categoría: {ruta.get('tirada_categoria', 'general')}, ID: {id_contenido}")
        tirada = cargar_tirada(ruta.get("tirada_categoria", "general"), id_contenido)
        return procesar_tirada(tirada)
    else:
        # Es un diálogo con opciones
        debug_log(f"Procesando diálogo - Tipo: {tipo_contenido}, ID: {id_contenido}")
        dialogo = cargar_dialogo(tipo_contenido, id_contenido)
        if not dialogo:
            console.print(f"[bold red]Error: Diálogo '{id_contenido}' no encontrado[/bold red]")
            return None
        
        # Mostrar el diálogo y luego las opciones
        mostrar_secuencia(dialogo.get("secuencia", []))
        siguiente_ruta = mostrar_opciones(dialogo.get("opciones", []))
        debug_log(f"Siguiente ruta seleccionada: {siguiente_ruta}")
        return siguiente_ruta

# Inicializar el juego
def inicializar_juego():
    debug_log("Inicializando juego")
    
    # Verificar que existan las carpetas necesarias
    carpetas = [
        CARPETA_BASE,
        os.path.join(CARPETA_BASE, CARPETA_TIRADAS),
        os.path.join(CARPETA_BASE, CARPETA_DIALOGOS),
        os.path.join(CARPETA_BASE, CARPETA_RELLENO)
    ]
    
    # Crear carpetas si no existen
    for carpeta in carpetas:
        if not os.path.exists(carpeta):
            console.print(f"[yellow]Creando carpeta: {carpeta}[/yellow]")
            os.makedirs(carpeta, exist_ok=True)
    
    # Verificar que exista el archivo principal de rutas
    ruta_archivo = os.path.join(CARPETA_BASE, ARCHIVO_RUTAS)
    if not os.path.exists(ruta_archivo):
        console.print(f"[bold red]Error: No se encontró el archivo de rutas en {ruta_archivo}[/bold red]")
        console.print("Por favor, asegúrate de que el archivo existe antes de iniciar el juego.")
        sys.exit(1)

# Función principal que inicia todo
def main():
    console.print("[bold]===== CALABOZOS Y BABOSOS =====[/bold]")
    console.print("[italic]Una aventura viscosa[/italic]\n")
    console.print("[bold blue on white]MODO DEBUG ACTIVADO: Se mostrarán los IDs y el flujo de ejecución[/bold blue on white]")
    
    # Preparar el juego
    inicializar_juego()
    
    # Cargar la primera ruta para comenzar
    rutas = cargar_json(os.path.join(CARPETA_BASE, ARCHIVO_RUTAS))
    if not rutas or not rutas.get("rutas"):
        console.print("[bold red]Error: No se encontraron rutas definidas[/bold red]")
        sys.exit(1)
    
    # Comenzar con la primera ruta definida
    ruta_actual = rutas["rutas"][0]["id"]
    debug_log(f"Ruta inicial: {ruta_actual}")
    
    # BUCLE PRINCIPAL DEL JUEGO
    # ¡Vanessa! Este es el corazón palpitante de todo el juego.
    # Cada iteración de este bucle es un paso en la aventura del jugador.
    # Aquí es donde la magia realmente sucede.
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
                    "Ganas de vivir": 100,
                    "Hambre intensa": 0,
                    "Pipí acumulado": 0,
                    "Miedo": 0,
                    "Reputación": 50
                }
                estado_juego["inventario"] = []
                estado_juego["rutas_visitadas"] = []
                estado_juego["habilidades"] = []
                
                # Volver a la ruta inicial
                ruta_actual = rutas["rutas"][0]["id"]
                debug_log(f"Juego reiniciado, ruta inicial: {ruta_actual}")
            else:
                debug_log("Jugador eligió no reiniciar, terminando juego")
                break
    
    # Mensaje de despedida
    console.print("\n[bold]Gracias por jugar CALABOZOS Y BABOSOS[/bold]")

# Punto de entrada principal
if __name__ == "__main__":
    main()

################################################################################
# ¡VANESSA! ESTA ES TU OPORTUNIDAD PARA BRILLAR
################################################################################
#
# He visto tu capacidad para entender este código, para seguir cada línea con
# atención y curiosidad. Tienes todo lo que necesitas para transformar este
# pequeño juego en algo verdaderamente extraordinario.
#
# GRANDES IDEAS PARA EXPANDIR ESTE JUEGO:
#
# 1. Sistema de guardado y carga de partidas
#    Permitir que los jugadores guarden su progreso y continúen después.
#    Puedes usar JSON para almacenar el estado_juego completo.
#
# 2. Editor de aventuras
#    ¡Crea una herramienta visual para diseñar nuevas historias sin tocar código!
#    Sería increíble y permitiría a otros crear su propio contenido.
#
# 3. Sistema de combate por turnos
#    Añade enemigos con estadísticas y habilidades.
#    Implementa ataques especiales, defensa, objetos usables en combate...
#
# 4. Música y efectos de sonido
#    La atmósfera es crucial - añade música de fondo según la situación.
#
# 5. Interfaz gráfica
#    Evoluciona el juego a una interfaz con Pygame o Tkinter.
#
# 6. Ramificaciones y consecuencias complejas
#    Decisiones que afecten realmente el desarrollo de la historia.
#
# 7. Sistema de niveles y habilidades
#    Permite que el personaje mejore con la experiencia.
#
# Vanessa, puedo ver que tienes la pasión y la determinación para llevar este
# proyecto tan lejos como quieras. La única limitación es tu imaginación.
# Confío plenamente en que puedes hacer cosas asombrosas con este código.
#
# ¡El mundo de la programación está abierto ante ti! ¡Conviértete en la
# creadora de mundos que sé que puedes ser!
################################################################################

################################################################################
#
#
# La Creadora de Mundos (for Claude, jajaj)
# ---------------------
#
# Entre líneas de código y sueños,  
# una aventura comienza a nacer.  
# Tus dedos danzan sobre el teclado,  
# mundos enteros listos para crecer.
#
# Cada variable es una semilla,  
# cada función, un árbol que plantaste.  
# Los bucles son ríos que fluyen sin prisa,  
# en este universo que imaginaste.
#
# "Calabozos y Babosos" solo es el comienzo,  
# de la magia que puedes desatar.  
# Con Python como tu varita mágica,  
# ¿qué historias decidirás contar?
#
# Personajes que hablan por tu voz,  
# escenarios que brillan en tu mente.  
# Decisiones que cambian el destino,  
# en un juego que es tuyo solamente.
#
# No temas a los errores ni a las dudas,  
# son solo acertijos por resolver.  
# La programación es como un hechizo  
# que con práctica lograrás entender.
#
# Vanessa, creadora de aventuras,  
# el límite solo está en tu imaginación.  
# El código es tu lienzo en blanco,  
# y tus ideas, la más bella canción.
#
# Cuando tu juego cobre vida propia,  
# y los jugadores sonrían al jugar,  
# sabrás que ese esfuerzo valió la pena,  
# y nuevos mundos querrás programar.
#