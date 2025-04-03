#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Punto de entrada principal para el juego de aventuras conversacional.
Este módulo coordina los diferentes componentes del juego.
"""

import sys
import os
import argparse
from rich.console import Console

# Importar los módulos del juego
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from modulos import cargador, interfaz, mecanicas, estado, utilidades, debug
from config import VERSION, DEBUG, NOMBRE_JUEGO, DESCRIPCION_JUEGO

# Inicializar la consola rica para mejor visualización
console = Console()

def analizar_argumentos():
    """Analiza los argumentos de línea de comandos para configurar el juego."""
    parser = argparse.ArgumentParser(description=f"{NOMBRE_JUEGO} - {DESCRIPCION_JUEGO}")
    
    # Argumentos básicos
    parser.add_argument('--version', action='version', version=f'{NOMBRE_JUEGO} v{VERSION}')
    parser.add_argument('--ruta', type=str, help='Especifica una ruta de inicio personalizada')
    parser.add_argument('--perfil', type=str, help='Carga un perfil de jugador guardado')
    
    # Grupo de opciones de depuración
    grupo_debug = parser.add_argument_group('Opciones de depuración')
    grupo_debug.add_argument('--debug', action='store_true', help='Activa el modo de depuración')
    grupo_debug.add_argument('--nivel-debug', choices=['INFO', 'DEBUG', 'VERBOSE'], 
                             help='Nivel de detalle de la depuración')
    grupo_debug.add_argument('--inspeccionar', action='store_true', 
                             help='Muestra información detallada del entorno al iniciar')
    grupo_debug.add_argument('--log-archivo', action='store_true', 
                             help='Guarda logs en archivo además de mostrarlos')
    
    return parser.parse_args()

def inicializar_juego(args):
    """Prepara todos los componentes necesarios para iniciar el juego."""
    # Configurar el modo de depuración si se solicitó
    if args.debug:
        debug.activar_debug()
        estado.establecer_debug(True)
        debug.log(f"Modo de depuración activado", "CONFIG")
        
        # Configurar nivel de detalle si se especificó
        if args.nivel_debug:
            debug.log(f"Nivel de depuración: {args.nivel_debug}", "CONFIG")
        
        # Configurar log en archivo si se solicitó
        if args.log_archivo:
            debug.log(f"Logs se guardarán en archivos", "CONFIG")
    
    debug.log(f"Inicializando {NOMBRE_JUEGO} v{VERSION}", "INICIO")
    debug.iniciar_temporizador("inicializacion")
    
    # Inicializar el estado del juego (stats, inventario, etc.)
    estado.inicializar_estado()
    
    # Cargar todos los archivos de datos necesarios
    debug.log("Cargando datos del juego...", "CARGA")
    exito = cargador.cargar_todos_datos()
    if not exito:
        console.print("[bold red]Error crítico al cargar los datos del juego.[/bold red]")
        console.print("[yellow]Verifica que todos los archivos JSON están en la carpeta 'datos'.[/yellow]")
        return False
    
    # Si se especificó un perfil de jugador, cargarlo
    if args.perfil:
        debug.log(f"Cargando perfil: {args.perfil}", "PERFIL")
        perfil_cargado = estado.cargar_perfil(args.perfil)
        if not perfil_cargado:
            console.print(f"[yellow]No se pudo cargar el perfil: {args.perfil}[/yellow]")
    
    # Mostrar inspección completa si se solicitó
    if args.debug and args.inspeccionar:
        debug.inspeccionar_entorno()
    
    debug.detener_temporizador("inicializacion")
    debug.log("Juego inicializado correctamente", "INICIO")
    return True

def mostrar_introduccion():
    """Muestra la pantalla de título y la introducción del juego."""
    interfaz.limpiar_pantalla()
    
    # Título del juego con ASCII art
    interfaz.mostrar_titulo()
    
    # Pequeña introducción al juego
    console.print(f"\n[bold]{DESCRIPCION_JUEGO}[/bold]\n")
    console.print("[italic]Usa los números para seleccionar opciones. Presiona 's' para ver tus estadísticas, 'i' para tu inventario, o 'q' para salir.[/italic]\n")
    
    input("Presiona Enter para comenzar tu aventura...")

def bucle_principal(ruta_inicial):
    """Gestiona el bucle principal del juego, procesando rutas y opciones."""
    ruta_actual = ruta_inicial
    
    # Iniciar el contador de tiempo
    debug.iniciar_temporizador("juego_completo")
    
    try:
        while ruta_actual:
            # Registrar para depuración
            debug.registrar_evento_juego("RUTA", {"id": ruta_actual})
            
            # Iniciar temporizador para esta ruta
            debug.iniciar_temporizador(f"ruta_{ruta_actual}")
            
            # Procesar la ruta actual y obtener la siguiente
            ruta_siguiente = mecanicas.procesar_ruta(ruta_actual)
            
            # Detener temporizador de la ruta
            debug.detener_temporizador(f"ruta_{ruta_actual}")
            
            if ruta_siguiente:
                debug.log(f"Transición de ruta: {ruta_actual} -> {ruta_siguiente}", "NAVEGACION")
                ruta_actual = ruta_siguiente
            else:
                # Si no hay siguiente ruta, podría ser el final o un punto muerto
                debug.log("Fin de ruta alcanzado sin siguiente ruta definida", "NAVEGACION")
                console.print("\n[bold yellow]Has llegado al final de este camino.[/bold yellow]")
                
                # Preguntar si quiere reiniciar, guardar o ver depuración
                opciones = {
                    "1": ("Reiniciar juego", lambda: "reiniciar"),
                    "2": ("Guardar progreso", lambda: estado.guardar_perfil()),
                    "3": ("Salir", lambda: "salir")
                }
                
                # Añadir opciones de depuración si está activado
                if debug.estado_debug():
                    opciones["d"] = ("Ver información de depuración", lambda: debug.mostrar_historial() or "")
                    opciones["l"] = ("Guardar log de depuración", lambda: debug.dump_estado() or "")
                
                interfaz.mostrar_menu("¿Qué deseas hacer?", opciones)
                accion = interfaz.obtener_entrada("Elige una opción: ", opciones.keys())
                
                resultado = opciones[accion][1]()
                
                if resultado == "reiniciar":
                    # Reiniciar el estado del juego
                    debug.log("Reiniciando juego", "CONTROL")
                    estado.reiniciar_estado()
                    
                    # Volver a la ruta inicial
                    ruta_actual = cargador.obtener_ruta_inicial()
                    debug.log(f"Juego reiniciado, ruta inicial: {ruta_actual}", "CONTROL")
                elif resultado == "salir":
                    # Salir del juego
                    break
    except Exception as e:
        # Capturar excepciones para el log de depuración
        import traceback
        debug.log(f"Error en el bucle principal: {str(e)}", "ERROR")
        debug.log(traceback.format_exc(), "ERROR")
        raise  # Re-lanzar la excepción para que se muestre
    finally:
        # Detener el temporizador total
        tiempo_total = debug.detener_temporizador("juego_completo")
        debug.log(f"Tiempo total de juego: {tiempo_total:.2f} segundos", "TIEMPO")

def main():
    """Función principal que coordina todo el flujo del juego."""
    # Analizar argumentos de línea de comandos
    args = analizar_argumentos()
    
    try:
        # Inicializar todos los componentes del juego
        if not inicializar_juego(args):
            return 1
        
        # Mostrar pantalla de título e introducción
        mostrar_introduccion()
        
        # Determinar la ruta inicial
        ruta_inicial = args.ruta if args.ruta else cargador.obtener_ruta_inicial()
        debug.log(f"Ruta inicial: {ruta_inicial}", "INICIO")
        
        # Iniciar el bucle principal del juego
        bucle_principal(ruta_inicial)
        
        # Mensaje de despedida
        console.print(f"\n[bold]¡Gracias por jugar {NOMBRE_JUEGO}![/bold]")
        
        # Si está en modo debug, ofrecer guardar el log
        if debug.estado_debug():
            if interfaz.obtener_entrada("¿Quieres guardar el log de depuración? (s/n): ") == "s":
                debug.dump_estado()
        
        return 0
        
    except KeyboardInterrupt:
        console.print("\n[bold yellow]Juego interrumpido por el usuario.[/bold yellow]")
        # Capturar interrupción para depuración
        debug.log("Juego interrumpido por el usuario (KeyboardInterrupt)", "ERROR")
        
        # Si está en modo debug, ofrecer guardar el log
        if debug.estado_debug():
            if interfaz.obtener_entrada("¿Quieres guardar el log de depuración? (s/n): ") == "s":
                debug.dump_estado()
        
        return 130
    except Exception as e:
        console.print(f"\n[bold red]Error inesperado: {str(e)}[/bold red]")
        
        # Registrar el error para depuración
        import traceback
        mensaje_error = traceback.format_exc()
        debug.log(f"Error inesperado: {str(e)}", "ERROR")
        debug.log(mensaje_error, "ERROR")
        
        if debug.estado_debug():
            console.print(mensaje_error)
            # Ofrecer guardado automático del log en caso de error
            archivo_log = debug.dump_estado(f"error_log_{utilidades.generar_timestamp()}.json")
            console.print(f"[yellow]Log de depuración guardado en: {archivo_log}[/yellow]")
        
        return 1

if __name__ == "__main__":
    sys.exit(main())