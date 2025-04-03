#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Módulo de depuración para el juego de aventuras conversacional.
Proporciona herramientas para ayudar en el desarrollo y prueba del juego.
"""

import os
import time
import json
from datetime import datetime
from rich.console import Console
from rich.panel import Panel
from rich.syntax import Syntax
from rich.table import Table
from rich.box import ROUNDED

# Importar configuración
import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from config import DEBUG

# Inicializar consola para salida
console = Console()

# Estado de depuración (puede ser cambiado en tiempo de ejecución)
_debug_activo = DEBUG

# Historial de acciones para seguimiento
_historial_acciones = []

def activar_debug():
    """Activa el modo de depuración."""
    global _debug_activo
    _debug_activo = True
    log("Modo depuración activado")

def desactivar_debug():
    """Desactiva el modo de depuración."""
    global _debug_activo
    _debug_activo = False
    log("Modo depuración desactivado", mostrar=True)  # Esto se muestra aun cuando se desactiva

def estado_debug():
    """Devuelve el estado actual del modo de depuración."""
    return _debug_activo

def log(mensaje, categoria="INFO", mostrar=None):
    """
    Registra un mensaje de depuración.
    
    Args:
        mensaje (str): Mensaje a registrar
        categoria (str): Categoría del mensaje (INFO, ERROR, WARNING, DEBUG)
        mostrar (bool, optional): Si es True, muestra aunque el debug esté desactivado
                                  Si es None, sigue la configuración actual
    """
    # Si mostrar es None, usar la configuración global
    if mostrar is None:
        mostrar = _debug_activo
    
    # Si no se debe mostrar, no hacer nada
    if not mostrar:
        return
    
    timestamp = datetime.now().strftime("%H:%M:%S.%f")[:-3]
    
    # Seleccionar color según la categoría
    color = "blue"
    if categoria == "ERROR":
        color = "red"
    elif categoria == "WARNING":
        color = "yellow"
    elif categoria == "DEBUG":
        color = "cyan"
    
    # Registrar en el historial
    _historial_acciones.append({
        "timestamp": timestamp,
        "categoria": categoria,
        "mensaje": mensaje
    })
    
    # Mostrar en consola
    console.print(f"[bold {color} on white][{timestamp}] {categoria}: {mensaje}[/bold {color} on white]")

def log_archivo(categoria, archivo, detalle=None):
    """
    Registra una operación específica de archivo.
    
    Args:
        categoria (str): Categoría de la operación (CARGA, BÚSQUEDA, etc.)
        archivo (str): Ruta del archivo
        detalle (str, optional): Detalles adicionales
    """
    if not _debug_activo:
        return
    
    mensaje = f"Archivo: {archivo}"
    if detalle:
        mensaje += f" | {detalle}"
    
    log(mensaje, categoria)

def inspeccionar_objeto(objeto, nombre="Objeto"):
    """
    Muestra los detalles de un objeto para depuración.
    
    Args:
        objeto: Objeto a inspeccionar
        nombre (str): Nombre para identificar el objeto
    """
    if not _debug_activo:
        return
    
    try:
        # Convertir a JSON para una representación más legible
        json_str = json.dumps(objeto, indent=2, ensure_ascii=False)
        
        # Crear panel con sintaxis resaltada
        syntax = Syntax(json_str, "json", theme="monokai", line_numbers=True)
        panel = Panel(
            syntax,
            title=f"[bold]Debug: {nombre}[/bold]",
            border_style="cyan"
        )
        
        # Mostrar panel
        console.print(panel)
    except Exception as e:
        log(f"Error al inspeccionar objeto: {str(e)}", "ERROR")
        # Intentar mostrar como string
        console.print(f"[cyan]Debug {nombre}:[/cyan] {str(objeto)}")

def mostrar_historial():
    """Muestra el historial de acciones de depuración."""
    if not _historial_acciones:
        console.print("[yellow]No hay historial de depuración disponible.[/yellow]")
        return
    
    # Crear tabla para mostrar historial
    tabla = Table(title="Historial de Depuración", box=ROUNDED)
    tabla.add_column("Hora", style="cyan")
    tabla.add_column("Categoría", style="yellow")
    tabla.add_column("Mensaje", style="white")
    
    # Limitar a últimas 50 entradas para no saturar
    entradas = _historial_acciones[-50:]
    
    for entrada in entradas:
        tabla.add_row(
            entrada["timestamp"],
            entrada["categoria"],
            entrada["mensaje"]
        )
    
    console.print(tabla)

def registrar_evento_juego(tipo, detalles):
    """
    Registra un evento importante del juego para seguimiento.
    
    Args:
        tipo (str): Tipo de evento (RUTA, TIRADA, DIALOGO, etc.)
        detalles (dict): Información detallada del evento
    """
    if not _debug_activo:
        return
    
    log(f"Evento {tipo}: {json.dumps(detalles, ensure_ascii=False)}", "EVENTO")

def dump_estado(nombre_archivo=None):
    """
    Guarda el estado actual de depuración en un archivo.
    
    Args:
        nombre_archivo (str, optional): Nombre del archivo
    
    Returns:
        str: Ruta del archivo guardado
    """
    if not nombre_archivo:
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        nombre_archivo = f"debug_dump_{timestamp}.json"
    
    # Asegurar que existe la carpeta
    os.makedirs("logs", exist_ok=True)
    
    ruta_completa = os.path.join("logs", nombre_archivo)
    
    try:
        datos = {
            "timestamp": datetime.now().isoformat(),
            "historial": _historial_acciones,
            "debug_activo": _debug_activo
        }
        
        with open(ruta_completa, 'w', encoding='utf-8') as f:
            json.dump(datos, f, indent=2, ensure_ascii=False)
        
        log(f"Estado de depuración guardado en {ruta_completa}", "INFO", True)
        return ruta_completa
    except Exception as e:
        log(f"Error al guardar estado de depuración: {str(e)}", "ERROR", True)
        return None

def limpiar_historial():
    """Limpia el historial de acciones de depuración."""
    global _historial_acciones
    _historial_acciones = []
    log("Historial de depuración limpiado", "INFO")

def iniciar_temporizador(nombre="default"):
    """
    Inicia un temporizador para medir rendimiento.
    
    Args:
        nombre (str): Identificador del temporizador
    """
    if not _debug_activo:
        return
    
    # Almacenar en variable global para acceso
    if not hasattr(iniciar_temporizador, "temporizadores"):
        iniciar_temporizador.temporizadores = {}
    
    iniciar_temporizador.temporizadores[nombre] = time.time()
    log(f"Temporizador '{nombre}' iniciado", "TIMER")

def detener_temporizador(nombre="default"):
    """
    Detiene un temporizador y muestra el tiempo transcurrido.
    
    Args:
        nombre (str): Identificador del temporizador
        
    Returns:
        float: Tiempo transcurrido en segundos
    """
    if not _debug_activo or not hasattr(iniciar_temporizador, "temporizadores"):
        return 0
    
    if nombre not in iniciar_temporizador.temporizadores:
        log(f"Temporizador '{nombre}' no existe", "WARNING")
        return 0
    
    tiempo_inicio = iniciar_temporizador.temporizadores[nombre]
    tiempo_transcurrido = time.time() - tiempo_inicio
    
    log(f"Temporizador '{nombre}': {tiempo_transcurrido:.4f} segundos", "TIMER")
    
    # Eliminar temporizador
    del iniciar_temporizador.temporizadores[nombre]
    
    return tiempo_transcurrido

# Comando especial para inspeccionar el entorno completo
def inspeccionar_entorno():
    """Muestra información completa del entorno para depuración."""
    if not _debug_activo:
        return
    
    from . import estado
    
    console.print("\n[bold cyan]=== INSPECCIÓN DEL ENTORNO ===[/bold cyan]")
    
    # Estado del juego
    inspeccionar_objeto(estado.obtener_estado_completo(), "Estado del juego")
    
    # Información del sistema
    info_sistema = {
        "python_version": sys.version,
        "platform": sys.platform,
        "debug_mode": _debug_activo,
        "historial_acciones": len(_historial_acciones)
    }
    inspeccionar_objeto(info_sistema, "Información del sistema")
    
    console.print("[bold cyan]=== FIN DE INSPECCIÓN ===[/bold cyan]\n")