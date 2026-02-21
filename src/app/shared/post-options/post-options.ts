import { Component, Input, Output, EventEmitter, HostListener, ElementRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService } from '../../services/notification';
import { MuteService } from '../../services/mute';
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
  @Input() userId!: string;
  @Input() isOwner: boolean = false; // <-- VARIABLE AÑADIDA PARA SABER SI ES TUYO
  @Output() optionSelected = new EventEmitter<{ action: string; postId: number }>();

  private notificationService = inject(NotificationService);
  private muteService = inject(MuteService);
  private blockService = inject(BlockService);

  isOpen = false;
  blocked = false;

  constructor(private elementRef: ElementRef) {}

  // ─────────────────────────────
  // MENU
  // ─────────────────────────────
  toggleMenu(event: Event) {
    event.stopPropagation();
    this.isOpen = !this.isOpen;

    // Solo consultamos si está bloqueado si el post NO es tuyo
    if (this.isOpen && !this.isOwner) {
      this.blocked = this.blockService.isBlocked(this.userId);
    }
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

      case 'delete':
        // La lógica de borrar se ejecuta en el componente padre (post-card)
        // Aquí solo dejamos que el código siga para que emita el evento abajo.
        break;
    }

    this.optionSelected.emit({ action, postId: this.postId });
  }

  // ─────────────────────────────
  // ESTADOS
  // ─────────────────────────────
  isMuted(): boolean {
    return this.muteService.isMuted(this.userId);
  }

  isBlocked(): boolean {
    return this.blocked;
  }

  // ─────────────────────────────
  // ACCIONES
  // ─────────────────────────────
  private copyLink() {
    const url = `${window.location.origin}/post/${this.postId}`;

    navigator.clipboard.writeText(url).then(() => {
      this.notificationService.showLinkCopied();
    });
  }

  private share() {
    const url = `${window.location.origin}/post/${this.postId}`;

    if (navigator.share) {
      navigator.share({
        title: 'Compartir post de Pearly',
        url: url
      }).catch(() => this.copyLink());
    } else {
      this.copyLink();
    }
  }

  private mute() {
    if (this.isMuted()) {
      this.muteService.unmute(this.userId);
      this.notificationService.success(`Has dejado de silenciar a ${this.userId}`);
    } else {
      this.muteService.mute(this.userId);
      this.notificationService.success(`Has silenciado a ${this.userId}`);
    }
  }

  private block() {
    if (this.blocked) {
      this.blockService.unblockUserByUsername(this.userId).subscribe(() => {
        this.blocked = false;
        this.notificationService.success(`${this.userId} desbloqueado`);
      });

    } else {
      this.notificationService.showConfirmAction(
        `¿Bloquear a ${this.userId}?`,
        'Sí, bloquear',
        () => {
          this.blockService.blockUserByUsername(this.userId).subscribe(() => {
            this.blocked = true;
            this.notificationService.success(`${this.userId} bloqueado`);
          });
        }
      );
    }
  }

  private report() {
    this.notificationService.showConfirmAction(
      '¿Reportar este contenido como inapropiado?',
      'Sí, reportar',
      () => {
        console.log(`Post ${this.postId} reportado`);
        this.notificationService.showUserReported();
      }
    );
  }

  // ─────────────────────────────
  // CERRAR MENU CLICK FUERA
  // ─────────────────────────────
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event) {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.isOpen = false;
    }
  }
}