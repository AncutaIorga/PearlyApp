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
  @Input() userId!: number; 
  @Input() userName: string = 'Usuario'; 
  @Input() isOwner: boolean = false; 
  @Output() optionSelected = new EventEmitter<{ action: string; postId: number }>();

  private notificationService = inject(NotificationService);
  private blockService = inject(BlockService);

  isOpen = false;

  constructor(private elementRef: ElementRef) {}

  toggleMenu(event: Event) {
    event.stopPropagation();
    this.isOpen = !this.isOpen;
  }

  handleAction(action: string) {
    this.isOpen = false;

    if (action === 'copy-link') {
      this.copyLink();
    } else if (action === 'share') {
      this.share();
    } else {
      // Delegamos "block", "mute", "report" y "delete" a la tarjeta padre (post-card)
      this.optionSelected.emit({ action, postId: this.postId });
    }
  }

  isMuted(): boolean {
    return this.blockService.mutedUsers().some(m => m.idBloqueado === this.userId);
  }

  isBlocked(): boolean {
    return this.blockService.blockedUsers().some(b => b.idBloqueado === this.userId);
  }

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

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event) {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.isOpen = false;
    }
  }
}