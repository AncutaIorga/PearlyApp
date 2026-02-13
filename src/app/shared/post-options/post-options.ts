import { Component, Input, Output, EventEmitter, HostListener, ElementRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService } from '../../services/notification';

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

  private notificationService = inject(NotificationService);
  
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
      this.notificationService.showLinkCopied();
    });
  }

  private share() {
    const url = `${window.location.origin}/post/${this.postId}`;
    if (navigator.share) {
      navigator.share({
        title: 'Compartir post de Pearly',
        url: url
      }).catch(() => {
        this.copyLink();
      });
    } else {
      this.copyLink();
    }
  }

  private mute() {
    const notificationId = this.notificationService.showConfirmAction(
      `¿Silenciar publicaciones de ${this.userId}?`,
      'Sí, silenciar',
      () => {
        console.log(`Usuario ${this.userId} silenciado`);
        this.notificationService.info(`✅ Usuario ${this.userId} silenciado`);
      }
    );
  }

  private block() {
    const notificationId = this.notificationService.showConfirmAction(
      `¿Bloquear a ${this.userId}? No verás más sus publicaciones.`,
      'Sí, bloquear',
      () => {
        console.log(`Usuario ${this.userId} bloqueado`);
        this.notificationService.showUserBlocked(this.userId);
      }
    );
  }

  private report() {
    const notificationId = this.notificationService.showConfirmAction(
      '¿Reportar este contenido como inapropiado?',
      'Sí, reportar',
      () => {
        console.log(`Post ${this.postId} reportado`);
        this.notificationService.showUserReported();
      }
    );
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event) {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.isOpen = false;
    }
  }
}