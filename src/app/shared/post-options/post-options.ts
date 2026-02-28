import { Component, Input, Output, EventEmitter, HostListener, ElementRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService } from '../../services/notification';
import { BlockService } from '../../services/block';

@Component({
  selector: 'app-post-options',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './post-options.html',
  styleUrls: ['./post-options.css']
})
export class PostOptionsComponent {

  @Input() postId!: number;
  @Input() userId!: number; // Cambiado a number para coincidir con la DB
  @Input() userName: string = 'Usuario'; // Añadido para mostrar en notificaciones
  @Input() isOwner: boolean = false; 
  @Output() optionSelected = new EventEmitter<{ action: string; postId: number }>();

  private notificationService = inject(NotificationService);
  private blockService = inject(BlockService);

  isOpen = false;

  constructor(private elementRef: ElementRef) {}

  // ─────────────────────────────
  // MENU
  // ─────────────────────────────
  toggleMenu(event: Event) {
    event.stopPropagation();
    this.isOpen = !this.isOpen;
  }

  handleAction(action: string) {
    this.isOpen = false;

    switch (action) {
      case 'copy-link': this.copyLink(); break;
      case 'share': this.share(); break;
      case 'report': this.report(); break;
      case 'mute': this.mute(); break;
      case 'block': this.block(); break;
    }

    this.optionSelected.emit({ action, postId: this.postId });
  }

  // ─────────────────────────────
  // ESTADOS (Sincronizados con BlockService)
  // ─────────────────────────────
  isMuted(): boolean {
    // Verificamos en el Signal del servicio si el ID está silenciado
    return this.blockService.mutedUsers().some(m => m.idBloqueado === this.userId);
  }

  isBlocked(): boolean {
    // Verificamos en el Signal del servicio si el ID está bloqueado
    return this.blockService.blockedUsers().some(b => b.idBloqueado === this.userId);
  }

  // ─────────────────────────────
  // ACCIONES LOCALES
  // ─────────────────────────────
  private copyLink() {
    const url = `${window.location.origin}/post/${this.postId}`;
    navigator.clipboard.writeText(url).then(() => {
      this.notificationService.success('Enlace copiado al portapapeles');
    });
  }

  private share() {
    const url = `${window.location.origin}/post/${this.postId}`;
    if (navigator.share) {
      navigator.share({ title: 'Pearly Post', url }).catch(() => this.copyLink());
    } else {
      this.copyLink();
    }
  }

  private report() {
    if (confirm('¿Reportar este contenido como inapropiado?')) {
      this.notificationService.success('Gracias por tu reporte. Lo revisaremos pronto.');
    }
  }

    private mute() {
    const targetId = Number(this.userId);
    if (this.isMuted()) {
      this.blockService.unmuteUser(targetId).subscribe(() => {
        this.notificationService.success(`Has dejado de silenciar a ${this.userName}`);
      });
    } else {
      this.blockService.muteUser(targetId).subscribe(() => {
        this.notificationService.success(`Has silenciado a ${this.userName}`);
      });
    }
  }

  private block() {
    const targetId = Number(this.userId);
    if (this.isBlocked()) {
      this.blockService.unblockUserByUsername(targetId).subscribe(() => {
        this.notificationService.success(`${this.userName} desbloqueado`);
      });
    } else {
      // Usamos el confirm nativo o el de tu servicio de notificaciones
      if (confirm(`¿Bloquear a ${this.userName}?`)) {
        this.blockService.blockUser(targetId).subscribe(() => {
          this.notificationService.success(`${this.userName} bloqueado`);
          // Emitimos para que el padre oculte el post
          this.optionSelected.emit({ action: 'block', postId: this.postId });
        });
      }
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event) {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.isOpen = false;
    }
  }
}