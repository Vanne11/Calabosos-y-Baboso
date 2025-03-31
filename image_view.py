#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Ejemplo de uso de imágenes en alta resolución para Calabozos y Babosos.
Este ejemplo muestra cómo integrar imágenes de 200x200 con mucho detalle en el juego.
"""

import os
import sys
import time
from rich.console import Console
from rich.panel import Panel
from rich.text import Text

# Importar nuestra biblioteca de imágenes HD
try:
    from imagen_consola_hd import mostrar_imagen, mostrar_imagen_hd, mostrar_imagen_ansi
except ImportError:
    print("Error: Asegúrate de tener imagen_consola_hd.py en el mismo directorio")
    sys.exit(1)

# Configuración
CARPETA_IMAGENES = "imagenes"
console = Console()

def limpiar_pantalla():
    """Limpia la pantalla de la terminal."""
    if os.name == 'nt':  # para Windows
        os.system('cls')
    else:  # para Mac y Linux
        os.system('clear')

def mostrar_escenario(nombre, descripcion, imagen, modo="hd"):
    """
    Muestra un escenario con su imagen en alta resolución.
    
    Args:
        nombre: Nombre del escenario
        descripcion: Descripción del escenario
        imagen: Nombre del archivo de imagen
        modo: "hd" (bloques unicode) o "ansi" (256 colores)
    """
    limpiar_pantalla()
    ruta = os.path.join(CARPETA_IMAGENES, imagen)
    
    # Título
    titulo = Text()
    titulo.append(f"===== {nombre} =====", style="bold magenta")
    console.print(Panel(titulo, border_style="cyan"))
    
    # Descripción
    console.print(f"\n{descripcion}\n")
    
    # Mostrar imagen
    if os.path.exists(ruta):
        console.print("[cyan]Cargando escenario...[/cyan]")
        time.sleep(0.5)  # Pequeña pausa para efecto
        mostrar_imagen(ruta, modo)
    else:
        console.print(f"[yellow]No se encuentra la imagen: {ruta}[/yellow]")

def mostrar_objeto(nombre, descripcion, imagen, modo="hd"):
    """
    Muestra un objeto con su imagen en alta resolución.
    
    Args:
        nombre: Nombre del objeto
        descripcion: Descripción del objeto
        imagen: Nombre del archivo de imagen
        modo: "hd" (bloques unicode) o "ansi" (256 colores)
    """
    console.print(f"\n[bold green]¡Has encontrado: {nombre}![/bold green]")
    console.print(f"{descripcion}\n")
    
    # Mostrar imagen
    ruta = os.path.join(CARPETA_IMAGENES, imagen)
    if os.path.exists(ruta):
        ancho = 50 if modo == "hd" else 100  # Ancho más pequeño para objetos
        if modo == "hd":
            mostrar_imagen_hd(ruta, ancho)
        else:
            mostrar_imagen_ansi(ruta, ancho)
    else:
        console.print(f"[yellow]No se encuentra la imagen: {ruta}[/yellow]")

def mostrar_enemigo(nombre, descripcion, imagen, modo="hd"):
    """
    Muestra un enemigo con su imagen en alta resolución.
    
    Args:
        nombre: Nombre del enemigo
        descripcion: Descripción del enemigo
        imagen: Nombre del archivo de imagen
        modo: "hd" (bloques unicode) o "ansi" (256 colores)
    """
    console.print(f"\n[bold red]¡ENEMIGO! {nombre}[/bold red]")
    console.print(f"{descripcion}\n")
    
    # Mostrar imagen
    ruta = os.path.join(CARPETA_IMAGENES, imagen)
    if os.path.exists(ruta):
        ancho = 80 if modo == "hd" else 160  # Ancho para enemigos
        if modo == "hd":
            mostrar_imagen_hd(ruta, ancho)
        else:
            mostrar_imagen_ansi(ruta, ancho)
    else:
        console.print(f"[yellow]No se encuentra la imagen: {ruta}[/yellow]")

def demostrar_con_imagenes(modo="hd"):
    """
    Demuestra el uso de imágenes HD en el juego.
    
    Args:
        modo: "hd" (bloques unicode) o "ansi" (256 colores)
    """
    limpiar_pantalla()
    console.print("[bold]===== CALABOZOS Y BABOSOS - DEMO HD =====\n[/bold]")
    console.print("Esta demo muestra cómo usar imágenes de alta resolución en el juego.")
    console.print(f"Modo seleccionado: [cyan]{modo}[/cyan]")
    input("\nPresiona Enter para comenzar la aventura...")
    
    # Escenario inicial
    mostrar_escenario(
        "Entrada a la Cripta Viscosa",
        "Te encuentras frente a una antigua cripta cubierta de musgo y una sustancia viscosa. "
        "El aire es húmedo y hay un extraño olor dulzón. La puerta está entreabierta, "
        "como invitándote a entrar. ¿Será una trampa o una oportunidad para la gloria?",
        "plaza.jpg",
        modo
    )
    input("\nPresiona Enter para entrar a la cripta...")
    
    # Enemigo
    mostrar_enemigo(
        "Guardián Baboso",
        "Al entrar, te encuentras cara a cara con el guardián de la cripta: una masa "
        "pulsante y viscosa con múltiples tentáculos y lo que parecen ser varios ojos. "
        "Se mueve lentamente hacia ti, dejando un rastro brillante a su paso.",
        "guardian.jpg",
        modo
    )
    input("\nPresiona Enter para combatir al guardián...")
    
    # Simulación de combate
    console.print("\n[bold]¡Combate iniciado![/bold]")
    for i in range(3):
        time.sleep(0.8)
        console.print(f"[cyan]Turno {i+1}...[/cyan]")
        resultado = __import__('random').randint(1, 20)
        if resultado > 15:
            console.print(f"[green]¡Golpe crítico! ({resultado})[/green]")
        elif resultado > 10:
            console.print(f"[yellow]Golpe normal ({resultado})[/yellow]")
        else:
            console.print(f"[red]¡Fallaste! ({resultado})[/red]")
    
    console.print("\n[bold green]¡Has derrotado al Guardián Baboso![/bold green]")
    time.sleep(1)
    
    # Objeto encontrado
    mostrar_objeto(
        "Amuleto de la Viscosidad",
        "Entre los restos del guardián, encuentras un extraño amuleto que parece estar "
        "hecho de una sustancia parecida al ámbar, pero más viscosa. Al tocarlo, "
        "sientes una extraña conexión con el entorno. Tus dedos se vuelven más "
        "pegajosos, pero de alguna manera esto te parece útil.",
        "amuleto.jpg",
        modo
    )
    
    # Nuevo escenario
    input("\nPresiona Enter para continuar explorando...")
    mostrar_escenario(
        "Cámara del Tesoro Viscoso",
        "Tras vencer al guardián, llegas a una amplia cámara llena de tesoros. Monedas, "
        "gemas y artefactos extraños cubren el suelo, aunque todos están recubiertos "
        "de la misma sustancia viscosa. En el centro de la sala hay un pedestal con "
        "algo que brilla intensamente.",
        "tesoro.jpg",
        modo
    )
    
    # Final de la demo
    input("\nPresiona Enter para terminar la demo...")
    console.print("\n[bold magenta]¡Fin de la demo![/bold magenta]")
    console.print("Así es como puedes integrar imágenes de alta resolución en tu juego.")
    console.print("\n[bold]Consejos para incluir esto en tu juego:[/bold]")
    console.print("1. Decide qué modo funciona mejor en tu terminal: HD o ANSI")
    console.print("2. Añade las funciones de imagen a los puntos clave de tu historia")
    console.print("3. Para escenarios, usa imágenes más grandes; para objetos, más pequeñas")
    console.print("4. Adapta los tamaños según el detalle que necesites mostrar")

def verificar_entorno():
    """Verifica que el entorno esté configurado correctamente."""
    if not os.path.exists(CARPETA_IMAGENES):
        console.print(f"[yellow]Creando carpeta '{CARPETA_IMAGENES}'...[/yellow]")
        os.makedirs(CARPETA_IMAGENES)
        console.print(f"[green]Carpeta '{CARPETA_IMAGENES}' creada.[/green]")
        console.print("[yellow]Por favor, coloca algunas imágenes en esta carpeta.[/yellow]")
        return False
    
    archivos = os.listdir(CARPETA_IMAGENES)
    imagenes = [f for f in archivos if f.lower().endswith(('.png', '.jpg', '.jpeg', '.gif', '.bmp'))]
    
    if not imagenes:
        console.print(f"[yellow]No hay imágenes en '{CARPETA_IMAGENES}'.[/yellow]")
        console.print("[yellow]Por favor, añade algunas imágenes antes de continuar.[/yellow]")
        return False
    
    console.print(f"[green]Se encontraron {len(imagenes)} imágenes:[/green]")
    for img in imagenes:
        console.print(f"- {img}")
    return True

def main():
    """Función principal."""
    limpiar_pantalla()
    console.print("[bold cyan]===== CALABOZOS Y BABOSOS: IMÁGENES EN ALTA RESOLUCIÓN =====\n[/bold cyan]")
    
    if not verificar_entorno():
        console.print("\n[bold]Para comenzar:[/bold]")
        console.print("1. Asegúrate de tener instalada la biblioteca Pillow: [cyan]pip install pillow[/cyan]")
        console.print(f"2. Coloca algunas imágenes en la carpeta '{CARPETA_IMAGENES}'")
        console.print("3. Vuelve a ejecutar este script")
        return
    
    # Elegir modo
    console.print("\n[bold]Elige el modo de visualización:[/bold]")
    console.print("1. Modo HD (bloques Unicode, más detalle)")
    console.print("2. Modo ANSI (256 colores, mayor compatibilidad)")
    
    while True:
        try:
            opcion = int(input("\nOpción (1 o 2): "))
            if opcion in [1, 2]:
                break
            else:
                console.print("[red]Por favor, elige 1 o 2.[/red]")
        except ValueError:
            console.print("[red]Por favor, ingresa un número válido.[/red]")
    
    modo = "hd" if opcion == 1 else "ansi"
    
    # Iniciar demo
    demostrar_con_imagenes(modo)

if __name__ == "__main__":
    main()
