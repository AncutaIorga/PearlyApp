import { Component, Input, Output, EventEmitter, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-post-options',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './post-options.html', 
  styleUrls: ['./post-options.css'] 
})
export class PostOptionsComponent {
  @Input() postId!: number;
  @Input() userId!: string;
  @Output() optionSelected = new EventEmitter<{ action: string; postId: number }>();

  isOpen = false;

  constructor(private elementRef: ElementRef) {}

  toggleMenu(event: Event) {
    event.stopPropagation();
    this.isOpen = !this.isOpen;
  }

  handleAction(action: string) {
    this.isOpen = false;

    switch (action) {
      case 'copy-link':
        this.copyLink();
        break;
      case 'share':
        this.share();
        break;
      case 'mute':
        this.mute();
        break;
      case 'block':
        this.block();
        break;
      case 'report':
        this.report();
        break;
    }

    this.optionSelected.emit({ action, postId: this.postId });
  }

  private copyLink() {
    const url = `${window.location.origin}/post/${this.postId}`;
    navigator.clipboard.writeText(url).then(() => {
      alert('✅ Link copiado al portapapeles');
    });
  }

  private share() {
    const url = `${window.location.origin}/post/${this.postId}`;
    if (navigator.share) {
      navigator.share({
        title: 'Compartir post de Pearly',
        url: url
      });
    } else {
      this.copyLink();
    }
  }

  private mute() {
    if (confirm(`¿Silenciar publicaciones de ${this.userId}?`)) {
      console.log(`Usuario ${this.userId} silenciado`);
      alert('✅ Usuario silenciado correctamente');
    }
  }

  private block() {
    if (confirm(`¿Bloquear a ${this.userId}? No verás más sus publicaciones.`)) {
      console.log(`Usuario ${this.userId} bloqueado`);
      alert('✅ Usuario bloqueado correctamente');
    }
  }

  private report() {
    if (confirm('¿Reportar este contenido como inapropiado?')) {
      console.log(`Post ${this.postId} reportado`);
      alert('✅ Contenido reportado. Gracias por tu colaboración.');
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event) {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.isOpen = false;
    }
  }
}
