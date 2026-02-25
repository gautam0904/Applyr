import { Component } from '@angular/core';
import { JobTable } from './components/job-table/job-table';
import { HeaderComponent } from './components/header/header.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [JobTable, HeaderComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App { }