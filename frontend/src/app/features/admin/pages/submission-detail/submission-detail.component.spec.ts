import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { SubmissionDetailComponent } from './submission-detail.component';
import { AdminService } from '../../services/admin.service';

describe('SubmissionDetailComponent', () => {
  let component: SubmissionDetailComponent;
  let fixture: ComponentFixture<SubmissionDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SubmissionDetailComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        AdminService,
      ],
    })
    .compileComponents();

    fixture = TestBed.createComponent(SubmissionDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
