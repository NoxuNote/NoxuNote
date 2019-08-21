export class NotificationService {
  element: HTMLElement;
  title: HTMLElement;
  content: HTMLElement;
  b1: HTMLElement;
  b2: HTMLElement;
  b1Action: Function;
  b2Action: Function;
  timeout: NodeJS.Timeout;
  constructor() {
    this.element = document.getElementById('notification')
    this.title = document.getElementById('notification-title')
    this.content = document.getElementById('notification-content')
    this.b1 = document.getElementById('notification-b1')
    this.b2 = document.getElementById('notification-b2')
  }
  showNotification(title: string, content: string, timeout: number, b1Text?: string, b1Action?: Function, b2Text?: string, b2Action?: Function) {
    this.hideNotification()
    this.element.classList.add('displayed')
    this.title.innerText = title
    this.content.innerText = content
    if (b1Text && b1Action) {
      this.b1.innerText = b1Text
      this.b1Action = ()=>{this.hideNotification();b1Action()}
      this.b1.addEventListener('click', ()=>this.b1Action())
      this.b1.style.display = "block"
    } else {
      this.b1.style.display = "none"
    }
    if (b2Text && b2Action) {
      this.b2.innerText = b2Text
      this.b2Action = ()=>{this.hideNotification();b2Action()}
      this.b2.addEventListener('click', ()=>this.b2Action())
      this.b2.style.display = "block"
    } else {
      this.b2.style.display = "none"
    }
    this.timeout = setTimeout(()=>this.hideNotification(), timeout)
  }
  hideNotification() {
    this.element.classList.remove('displayed')
    // Suppression des EventListeners
    this.b1.removeEventListener('click', ()=>this.b1Action())
    this.b2.removeEventListener('click', ()=>this.b2Action())
    clearTimeout(this.timeout)
  }
}