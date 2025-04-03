#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Módulo de interfaz para el juego de aventuras conversacional.
Gestiona toda la presentación visual y la interacción con el usuario.
"""

import os
import time
import random
from rich.console import Console
from rich.panel import Panel
from rich.text import Text
from rich.table import Table
from rich.prompt import Prompt
from rich.layout import Layout
from rich.style import Style
from rich.box import DOUBLE, ROUNDED, HEAVY

# Importar módulos del juego
from . import estado
from . import utilidades
from . import cargador

# Importar configuración
import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from config import (
    NOMBRE_JUEGO,
    ANCHO_TERMINAL,
    COLOR_TITULO,
    COLOR_TEXTO_NORMAL,
    COLOR_DIALOGO_NARRADOR,
    COLOR_DIALOGO_PROTAGONISTA,
    COLOR_DIALOGO_NPC
)

# Inicializar consola para salida
console = Console()

# Función para limpiar la pantalla
def limpiar_pantalla():
    """Limpia la pantalla de la terminal."""
    if estado.obtener_debug():
        # En modo debug, solo mostrar una línea de separación para ver el historial
        console.print("\n" + "=" * ANCHO_TERMINAL + "\n")
        return
    
    # Limpiar pantalla según el sistema operativo
    if os.name == 'nt':  # Windows
        os.system('cls')
    else:  # Unix/Linux/Mac
        os.system('clear')

def mostrar_titulo():
    """Muestra el título del juego con arte ASCII si está disponible."""
    # Intentar cargar arte ASCII para el título
    ascii_art = cargador.cargar_ascii_art("titulo")
    
    if ascii_art:
        console.print(f"[bold {COLOR_TITULO}]{ascii_art}[/bold {COLOR_TITULO}]")
    else:
        # Título de respaldo si no hay arte ASCII
        titulo = Text(NOMBRE_JUEGO, style=f"bold {COLOR_TITULO}")
        console.print(Panel(titulo, box=HEAVY, expand=False))

def mostrar_escenario(ruta_info):
    """
    Muestra la descripción de un escenario.
    
    Args:
        ruta_info (dict): Información de la ruta actual
    """
    if not ruta_info:
        console.print("[bold red]Error: Información de ruta no válida[/bold red]")
        return
    
    # Obtener ID del escenario
    escenario_id = ruta_info.get("escenario")
    
    # Buscar descripción del escenario
    descripcion_id = f"descripcion_{escenario_id}"
    descripcion = cargador.cargar_relleno(descripcion_id)
    
    if not descripcion:
        descripcion = ruta_info.get("descripcion", f"Te encuentras en {ruta_info.get('nombre', 'un lugar desconocido')}.")
    
    # Resolver referencias en la descripción
    descripcion = cargador.resolver_referencias(descripcion)
    
    # Crear panel con la descripción
    panel = Panel(
        Text(descripcion, style=COLOR_TEXTO_NORMAL),
        title=f"[bold]{ruta_info.get('nombre', 'ESCENARIO')}[/bold]",
        border_style="blue",
        width=min(ANCHO_TERMINAL, console.width)
    )
    
    # Mostrar panel
    console.print(panel)

def mostrar_menu(titulo, opciones, estilo="yellow"):
    """
    Muestra un menú de opciones genérico.
    
    Args:
        titulo (str): Título del menú
        opciones (dict): Diccionario de opciones {clave: (texto, función)}
        estilo (str): Color para el título
    """
    console.print(f"\n[bold {estilo}]{titulo}[/bold {estilo}]")
    
    for clave, (texto, _) in opciones.items():
        console.print(f"[green]{clave}. {texto}[/green]")

def obtener_entrada(mensaje, opciones_validas=None, por_defecto=None):
    """
    Solicita entrada al usuario con validación.
    
    Args:
        mensaje (str): Mensaje para mostrar
        opciones_validas (list/set, optional): Opciones permitidas
        por_defecto (str, optional): Valor por defecto si se presiona Enter
    
    Returns:
        str: La entrada del usuario
    """
    while True:
        entrada = input(f"\n{mensaje}").strip().lower()
        
        # Si no hay entrada y hay valor por defecto, usar ese
        if not entrada and por_defecto:
            return por_defecto
        
        # Si hay opciones válidas, verificar que la entrada sea válida
        if opciones_validas and entrada not in opciones_validas:
            console.print("[bold red]Opción no válida. Por favor, intenta de nuevo.[/bold red]")
            continue
        
        return entrada

def mostrar_opciones(opciones, ruta_id=None):
    """
    Muestra las opciones disponibles y obtiene la selección del usuario.
    
    Args:
        opciones (list): Lista de diccionarios con opciones
        ruta_id (str, optional): ID de la ruta actual (para contexto)
    
    Returns:
        str: ID de la siguiente ruta o None si no hay selección válida
    """
    if not opciones:
        utilidades.log_debug("No hay opciones disponibles")
        return None
    
    utilidades.log_debug(f"Mostrando {len(opciones)} opciones")
    
    # Muestra el título para las opciones
    console.print("\n[bold yellow]¿Qué quieres hacer?[/bold yellow]")
    
    # Muestra cada opción numerada
    for i, opcion in enumerate(opciones, 1):
        console.print(f"[green]{i}. {opcion.get('texto', 'Sin texto')}[/green]")
        utilidades.log_debug(f"Opción {i}: {opcion.get('texto')} -> {opcion.get('siguiente_ruta', 'Sin ruta')}")
    
    # Opciones adicionales del sistema (siempre disponibles)
    console.print("[dim]s. Ver estadísticas[/dim]")
    console.print("[dim]i. Ver inventario[/dim]")
    console.print("[dim]g. Guardar partida[/dim]")
    console.print("[dim]q. Salir del juego[/dim]")
    
    # Bucle para obtener una selección válida
    while True:
        seleccion = input("\nElige una opción: ").strip().lower()
        utilidades.log_debug(f"Selección del usuario: {seleccion}")
        
        # Procesa opciones del sistema
        if seleccion == 's':
            mostrar_stats()  # Muestra estadísticas
            continue  # Vuelve a pedir selección
        elif seleccion == 'i':
            mostrar_inventario()  # Muestra inventario
            continue  # Vuelve a pedir selección
        elif seleccion == 'g':
            guardar_partida()  # Guarda la partida
            continue  # Vuelve a pedir selección
        elif seleccion == 'q':
            # Confirmación antes de salir
            if Prompt.ask("¿Seguro que quieres salir?", choices=["s", "n"]) == "s":
                # Preguntar si quiere guardar antes de salir
                if Prompt.ask("¿Quieres guardar la partida antes de salir?", choices=["s", "n"]) == "s":
                    guardar_partida()
                sys.exit(0)  # Sale del programa
            continue  # Si no confirma, vuelve a pedir selección
        
        # Procesa selección numérica (opciones de la historia)
        try:
            indice = int(seleccion) - 1  # Convierte a índice (0-based)
            if 0 <= indice < len(opciones):
                siguiente_ruta = opciones[indice].get("siguiente_ruta")
                utilidades.log_debug(f"Seleccionada opción {indice+1}, siguiente ruta: {siguiente_ruta}")
                return siguiente_ruta
            else:
                console.print("[bold red]Opción no válida[/bold red]")
        except ValueError:
            console.print("[bold red]Por favor, introduce un número o una letra válida[/bold red]")

def guardar_partida():
    """Muestra el menú para guardar la partida actual."""
    # Si estamos en una ruta, guardarla en el estado
    ultima_ruta = estado.obtener_ultima_ruta()
    if ultima_ruta:
        nombre = input("\nIntroduce un nombre para la partida (deja en blanco para usar fecha actual): ").strip()
        estado.guardar_perfil(nombre if nombre else None)

def mostrar_stats():
    """Muestra las estadísticas actuales del jugador."""
    utilidades.log_debug("Mostrando estadísticas del jugador")
    
    # Crear una tabla bonita para mostrar las estadísticas
    tabla = Table(title="Estadísticas", box=ROUNDED)
    tabla.add_column("Característica", style="cyan")
    tabla.add_column("Valor", style="green")
    tabla.add_column("Estado", style="yellow")
    
    # Para cada estadística, añade una fila a la tabla con color según su valor
    for stat, valor in estado.obtener_stats().items():
        # Determinar color según el valor
        color = "green"
        if valor < 30:
            color = "red"
        elif valor < 60:
            color = "yellow"
        
        # Determinar estado textual
        estado_texto = "Normal"
        if valor < 20:
            estado_texto = "¡Crítico!"
        elif valor < 40:
            estado_texto = "Peligroso"
        elif valor < 60:
            estado_texto = "Preocupante"
        elif valor > 80:
            estado_texto = "Excelente"
        
        # Añadir fila a la tabla
        tabla.add_row(
            stat.replace("_", " ").title(),
            f"[{color}]{valor}[/{color}]",
            estado_texto
        )
    
    # Mostrar tiempo de juego
    tiempo = estado.obtener_tiempo_juego_formateado()
    tabla.add_row("Tiempo de juego", tiempo, "")
    
    # Mostrar la tabla en la consola
    console.print(tabla)
    input("\nPresiona Enter para continuar...")

def mostrar_inventario():
    """Muestra el inventario actual del jugador."""
    utilidades.log_debug("Mostrando inventario del jugador")
    
    inventario = estado.obtener_inventario()
    
    # Si el inventario está vacío, muestra un mensaje
    if not inventario:
        console.print(Panel("[yellow]Tu inventario está vacío.[/yellow]", title="Inventario", border_style="blue"))
        input("\nPresiona Enter para continuar...")
        return
    
    # Crear una tabla bonita para mostrar el inventario
    tabla = Table(title="Inventario", box=ROUNDED)
    tabla.add_column("Objeto", style="cyan")
    tabla.add_column("Descripción", style="green")
    
    # Para cada objeto, añade una fila a la tabla
    for objeto in inventario:
        # Buscar descripción del objeto en el archivo de relleno
        descripcion_id = f"objeto_{objeto.lower().replace(' ', '_')}"
        descripcion = cargador.cargar_relleno(descripcion_id)
        if not descripcion:
            descripcion = "Sin descripción disponible"
        
        tabla.add_row(objeto, descripcion)
    
    # Mostrar la tabla en la consola
    console.print(tabla)
    input("\nPresiona Enter para continuar...")

def mostrar_secuencia(secuencia):
    """
    Muestra una secuencia de diálogos.
    
    Args:
        secuencia (list): Lista de diálogos a mostrar
    """
    if not secuencia:
        utilidades.log_debug("No hay secuencia de diálogo para mostrar")
        return
    
    utilidades.log_debug(f"Mostrando secuencia de diálogo con {len(secuencia)} líneas")
    
    ultimo_personaje = None
    
    # Para cada fragmento de diálogo en la secuencia
    for i, dialogo in enumerate(secuencia):
        personaje = dialogo.get("personaje", "???")
        texto_original = dialogo.get("texto", "...")
        
        utilidades.log_debug(f"Diálogo {i+1}/{len(secuencia)} - Personaje: {personaje}")
        
        # Resolver referencias a textos dinámicos
        texto = cargador.resolver_referencias(texto_original)
        
        # Crear texto enriquecido con colores según el personaje
        estilo_personaje = COLOR_DIALOGO_NPC  # Estilo predeterminado
        if personaje == "NARRADOR":
            estilo_personaje = COLOR_DIALOGO_NARRADOR
        elif personaje == "PROTAGONISTA":
            estilo_personaje = COLOR_DIALOGO_PROTAGONISTA
        
        # Construye el texto con el nombre del personaje y su diálogo
        rich_text = Text(f"\n{personaje}: ", style=f"bold {estilo_personaje}")
        rich_text.append(texto, style=COLOR_TEXTO_NORMAL)
        
        # Mostrar el diálogo con una breve pausa para efecto dramático
        console.print(rich_text)
        time.sleep(0.5)  # Pequeña pausa entre líneas
        
        # Si hay pausa explícita, esperar input del usuario
        if dialogo.get("pausa", False):
            input("\nPresiona Enter para continuar...")

def mostrar_tirada_dados(valor, dificultad, modificador=0, inverso=False):
    """
    Muestra la animación y resultado de una tirada de dados.
    
    Args:
        valor (int): Resultado de la tirada
        dificultad (int): Dificultad a superar
        modificador (int): Modificador a aplicar
        inverso (bool): Si el modificador se resta en lugar de sumarse
    """
    # Calcular resultado final
    resultado_modificado = valor + modificador if not inverso else valor - modificador
    
    # Mostrar animación de dados (muestra números aleatorios rápidamente)
    console.print("\n[bold cyan]Tirando dados...[/bold cyan]")
    for i in range(3):  # Muestra 3 números aleatorios antes del resultado final
        console.print(f"[dim]{random.randint(1, 20)}...[/dim]", end="\r")
        time.sleep(0.3)  # Pausa por 0.3 segundos para crear efecto de animación
    
    # Mostrar resultado final con formato según sea crítico o pifia
    if valor == 20:
        # ¡Crítico! El mejor resultado posible (20 natural en el dado)
        console.print(f"[bold green]¡CRÍTICO! Resultado: {valor}[/bold green]")
    elif valor == 1:
        # ¡Pifia! El peor resultado posible (1 natural en el dado)
        console.print(f"[bold red]¡PIFIA! Resultado: {valor}[/bold red]")
    else:
        # Resultado normal, color verde si supera la dificultad, rojo si no
        color = "green" if resultado_modificado >= dificultad else "red"
        mod_texto = f"+ {modificador}" if modificador >= 0 else f"- {abs(modificador)}"
        console.print(f"[{color}]Resultado: {valor} ({mod_texto} = {resultado_modificado})[/{color}]")

def mostrar_resultado_tirada(texto_resultado, respuesta_npc=None):
    """
    Muestra el texto descriptivo del resultado de una tirada.
    
    Args:
        texto_resultado (str): Descripción del resultado
        respuesta_npc (str, optional): Respuesta de un NPC al resultado
    """
    # Pausa dramática después de la tirada
    time.sleep(1)
    
    # Panel con el resultado
    console.print(Panel(
        Text(texto_resultado, style=COLOR_TEXTO_NORMAL),
        title="[bold]Resultado de la tirada[/bold]",
        border_style="yellow"
    ))
    
    # Si hay respuesta de NPC, mostrarla
    if respuesta_npc:
        time.sleep(0.8)  # Pausa antes de mostrar respuesta
        rich_text = Text("\nNPC: ", style=f"bold {COLOR_DIALOGO_NPC}")
        rich_text.append(respuesta_npc, style=COLOR_TEXTO_NORMAL)
        console.print(rich_text)
    
    # Esperar a que el usuario continúe
    input("\nPresiona Enter para continuar...")

def mostrar_efectos(efectos):
    """
    Muestra los efectos aplicados tras una tirada u otra acción.
    
    Args:
        efectos (dict): Diccionario con efectos a mostrar
    """
    if not efectos:
        return
    
    console.print("\n[bold purple]Efectos aplicados:[/bold purple]")
    
    # Mostrar cambios en stats
    for stat, valor in efectos.items():
        if stat in estado.obtener_stats():
            if valor > 0:
                console.print(f"[green]Tu '{stat}' ha aumentado en {valor}[/green]")
            elif valor < 0:
                console.print(f"[red]Tu '{stat}' ha disminuido en {abs(valor)}[/red]")
    
    # Mostrar objetos ganados
    if "objetos" in efectos:
        for objeto in efectos["objetos"]:
            console.print(f"[green]Has obtenido: {objeto}[/green]")
    
    # Mostrar objetos perdidos
    if "objetos_perdidos" in efectos:
        for objeto in efectos["objetos_perdidos"]:
            console.print(f"[red]Has perdido: {objeto}[/red]")

def mostrar_error(mensaje):
    """
    Muestra un mensaje de error con formato destacado.
    
    Args:
        mensaje (str): Mensaje de error a mostrar
    """
    console.print(f"[bold red]ERROR: {mensaje}[/bold red]")

def mostrar_advertencia(mensaje):
    """
    Muestra un mensaje de advertencia con formato destacado.
    
    Args:
        mensaje (str): Mensaje de advertencia a mostrar
    """
    console.print(f"[bold yellow]ADVERTENCIA: {mensaje}[/bold yellow]")

def mostrar_info(mensaje):
    """
    Muestra un mensaje informativo con formato destacado.
    
    Args:
        mensaje (str): Mensaje informativo a mostrar
    """
    console.print(f"[bold blue]INFO: {mensaje}[/bold blue]")

def mostrar_perfiles_guardados():
    """
    Muestra un listado de los perfiles guardados disponibles.
    
    Returns:
        dict: Mapeado de índices a nombres de perfil, o None si no hay perfiles
    """
    perfiles = estado.listar_perfiles()
    
    if not perfiles:
        console.print("[yellow]No hay perfiles guardados disponibles.[/yellow]")
        return None
    
    console.print("[bold cyan]Perfiles guardados disponibles:[/bold cyan]")
    
    # Crear tabla para mostrar perfiles
    tabla = Table(box=ROUNDED)
    tabla.add_column("#", style="cyan", justify="right")
    tabla.add_column("Nombre", style="green")
    tabla.add_column("Fecha", style="yellow")
    tabla.add_column("Tiempo jugado", style="magenta")
    
    # Diccionario para mapear índices a nombres de perfil
    mapa_perfiles = {}
    
    for i, perfil in enumerate(perfiles, 1):
        nombre = perfil["nombre"]
        fecha = perfil["fecha"].split("T")[0] if "T" in perfil["fecha"] else perfil["fecha"]
        tiempo = perfil["tiempo_formato"]
        
        tabla.add_row(str(i), nombre, fecha, tiempo)
        mapa_perfiles[str(i)] = nombre
    
    console.print(tabla)
    return mapa_perfiles

def mostrar_progreso_carga(mensaje="Cargando"):
    """
    Muestra un indicador simple de carga.
    
    Args:
        mensaje (str): Mensaje a mostrar durante la carga
    """
    with console.status(f"[bold green]{mensaje}...", spinner="dots"):
        time.sleep(1.5)  # Simular tiempo de carga