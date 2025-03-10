import { ComponentFixture, TestBed,  } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { WorkspaceComponent } from './workspace.component';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { RouterTestingModule } from '@angular/router/testing';


xdescribe('WorkspaceComponent', () => {
  let component: WorkspaceComponent;
  let fixture: ComponentFixture<WorkspaceComponent>;

  class RouterStub {
    navigate = jasmine.createSpy('navigate');
  }



  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ WorkspaceComponent ],
      schemas: [NO_ERRORS_SCHEMA],
      imports: [RouterTestingModule]
    })
    .compileComponents();
    fixture = TestBed.createComponent(WorkspaceComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    fixture.destroy();
  });


  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
