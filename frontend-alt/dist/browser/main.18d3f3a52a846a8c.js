"use strict";(self.webpackChunkangular_rspack_demo=self.webpackChunkangular_rspack_demo||[]).push([["889"],{986(e,t,r){r(964),r(476),r(131),"u">typeof window&&window.WinBox?console.debug("WinBox loaded and available on window.WinBox"):console.warn("WinBox was imported but not found on window object");var a=r(541),s=r(181),i=r(616),o=r(800),n=r(364),l=r(559),d=Object.defineProperty,c=Object.getOwnPropertyDescriptor,p=(e,t,r,a)=>{for(var s,i=a>1?void 0:a?c(t,r):t,o=e.length-1;o>=0;o--)(s=e[o])&&(i=(a?s(t,r,i):s(i))||i);return a&&i&&d(t,r,i),i};let b=class{constructor(){this.columns=[],this.actions=[],this.loading=!1,this.emptyMessage="No records to display",this.pageSize=10,this.idField="id",this.refresh=new s.bkB,this.add=new s.bkB,this.edit=new s.bkB,this.delete=new s.bkB,this.view=new s.bkB,this._data=(0,s.vPA)([]),this.searchQuery=(0,s.vPA)(""),this.sortKey=(0,s.vPA)(null),this.sortDir=(0,s.vPA)("asc"),this.currentPage=(0,s.vPA)(1),this.editingId=(0,s.vPA)(null),this.displayData=(0,l.EW)(()=>{let e=this._data(),t=this.searchQuery().toLowerCase();t&&(e=e.filter(e=>Object.values(e).some(e=>String(e).toLowerCase().includes(t))));let r=this.sortKey();r&&(e=[...e].sort((e,t)=>{let a=e[r],s=t[r],i=a<s?-1:+(a>s);return"asc"===this.sortDir()?i:-i}));let a=(this.currentPage()-1)*this.pageSize;return e.slice(a,a+this.pageSize)}),this.totalItems=(0,l.EW)(()=>{let e=this.searchQuery().toLowerCase();return e?this._data().filter(t=>Object.values(t).some(t=>String(t).toLowerCase().includes(e))).length:this._data().length}),this.totalPages=(0,l.EW)(()=>Math.ceil(this.totalItems()/this.pageSize)),this.startIndex=(0,l.EW)(()=>(this.currentPage()-1)*this.pageSize),this.endIndex=(0,l.EW)(()=>Math.min(this.startIndex()+this.pageSize,this.totalItems())),this.visiblePages=(0,l.EW)(()=>{let e=[],t=this.totalPages(),r=this.currentPage();for(let a=1;a<=t;a++)1===a||a===t||a>=r-1&&a<=r+1?e.push(a):-1!==e[e.length-1]&&e.push(-1);return e})}set data(e){this._data.set(e)}onSearch(e){let t=e.target.value;this.searchQuery.set(t),this.currentPage.set(1)}clearSearch(){this.searchQuery.set(""),this.currentPage.set(1)}toggleSort(e){this.sortKey()===e?this.sortDir.update(e=>"asc"===e?"desc":"asc"):(this.sortKey.set(e),this.sortDir.set("asc"))}goToPage(e){e>=1&&e<=this.totalPages()&&this.currentPage.set(e)}getRowId(e){return e[this.idField]}getCellValue(e,t){return String(e[t]??"")}updateCell(e,t,r){}formatValue(e,t){return null==e?"-":"date"===t&&e?new Date(e).toLocaleDateString():"number"===t?Number(e).toLocaleString():String(e)}handleAction(e,t){switch(e){case"edit":this.edit.emit(t);break;case"delete":this.delete.emit(t);break;case"view":this.view.emit(t)}}};p([(0,i.pde)()],b.prototype,"data",1),p([(0,i.pde)()],b.prototype,"columns",2),p([(0,i.pde)()],b.prototype,"actions",2),p([(0,i.pde)()],b.prototype,"loading",2),p([(0,i.pde)()],b.prototype,"emptyMessage",2),p([(0,i.pde)()],b.prototype,"pageSize",2),p([(0,i.pde)()],b.prototype,"trackByFn",2),p([(0,i.pde)()],b.prototype,"idField",2),p([(0,i.k7i)()],b.prototype,"refresh",2),p([(0,i.k7i)()],b.prototype,"add",2),p([(0,i.k7i)()],b.prototype,"edit",2),p([(0,i.k7i)()],b.prototype,"delete",2),p([(0,i.k7i)()],b.prototype,"view",2),b=p([(0,i.uAl)({selector:"app-data-table",standalone:!0,imports:[o.MD,n.YN],template:`
    <div class="data-table-container">
      <div class="table-toolbar">
        <div class="search-box">
          <span class="search-icon">\u{1F50D}</span>
          <input
            type="text"
            class="search-input"
            placeholder="Search..."
            [value]="searchQuery()"
            (input)="onSearch($event)">
          @if (searchQuery()) {
            <button class="clear-btn" (click)="clearSearch()">\xd7</button>
          }
        </div>
        <div class="toolbar-actions">
          <button class="toolbar-btn" (click)="refresh.emit()">
            <span>\u{1F504}</span> Refresh
          </button>
          <button class="toolbar-btn primary" (click)="add.emit()">
            <span>+</span> Add New
          </button>
        </div>
      </div>

      @if (loading) {
        <div class="loading-state">
          <div class="spinner"></div>
          <span>Loading data...</span>
        </div>
      } @else if (displayData().length === 0) {
        <div class="empty-state">
          <span class="empty-icon">\u{1F4ED}</span>
          <h3>No data found</h3>
          <p>{{ emptyMessage }}</p>
        </div>
      } @else {
        <div class="table-wrapper">
          <table class="data-table">
            <thead>
              <tr>
                @for (col of columns; track col.key) {
                  <th
                    [style.width]="col.width"
                    [class.sortable]="col.sortable"
                    (click)="col.sortable && toggleSort(col.key)">
                    {{ col.label }}
                    @if (col.sortable && sortKey() === col.key) {
                      <span class="sort-indicator">{{ sortDir() === 'asc' ? '\u2191' : '\u2193' }}</span>
                    }
                  </th>
                }
                @if (actions.length > 0) {
                  <th style="width: 120px">Actions</th>
                }
              </tr>
            </thead>
            <tbody>
              @for (row of displayData(); track trackByFn ? trackByFn(row) : $index) {
                <tr [class.editing]="editingId() === getRowId(row)">
                  @for (col of columns; track col.key) {
                    <td>
                      @if (editingId() === getRowId(row) && col.type !== 'actions') {
                        <input
                          type="{{ col.type || 'text' }}"
                          class="edit-input"
                          [value]="getCellValue(row, col.key)"
                          (input)="updateCell($event, row, col.key)">
                      } @else {
                        {{ formatValue(row[col.key], col.type) }}
                      }
                    </td>
                  }
                  @if (actions.length > 0) {
                    <td class="actions-cell">
                      @for (action of actions; track action.id) {
                        <button
                          type="button"
                          class="action-btn"
                          [class]="action.id"
                          [title]="action.label"
                          (click)="handleAction(action.id, row)">
                          {{ action.icon }}
                        </button>
                      }
                    </td>
                  }
                </tr>
              }
            </tbody>
          </table>
        </div>
      }

      @if (totalItems() > pageSize) {
        <div class="pagination">
          <span class="page-info">
            Showing {{ startIndex() + 1 }}-{{ endIndex() }} of {{ totalItems() }}
          </span>
          <div class="page-buttons">
            <button
              class="page-btn"
              [disabled]="currentPage() === 1"
              (click)="goToPage(currentPage() - 1)">
              \u2190 Prev
            </button>
            @for (page of visiblePages(); track page) {
              <button
                class="page-btn"
                [class.active]="currentPage() === page"
                (click)="goToPage(page)">
                {{ page }}
              </button>
            }
            <button
              class="page-btn"
              [disabled]="currentPage() === totalPages()"
              (click)="goToPage(currentPage() + 1)">
              Next \u2192
            </button>
          </div>
        </div>
      }
    </div>
  `,styles:[`
    .data-table-container {
      background: #1e293b;
      border-radius: 12px;
      border: 1px solid #334155;
      overflow: hidden;
    }

    .table-toolbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 1.25rem;
      background: #0f172a;
      border-bottom: 1px solid #334155;
    }

    .search-box {
      display: flex;
      align-items: center;
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 8px;
      padding: 0 0.75rem;
      width: 300px;
    }

    .search-icon {
      font-size: 0.875rem;
      margin-right: 0.5rem;
    }

    .search-input {
      flex: 1;
      background: transparent;
      border: none;
      color: #e2e8f0;
      font-size: 0.875rem;
      padding: 0.625rem 0;
      outline: none;
    }

    .search-input::placeholder {
      color: #64748b;
    }

    .clear-btn {
      background: none;
      border: none;
      color: #64748b;
      font-size: 1.25rem;
      cursor: pointer;
      padding: 0;
      line-height: 1;
    }

    .clear-btn:hover {
      color: #94a3b8;
    }

    .toolbar-actions {
      display: flex;
      gap: 0.75rem;
    }

    .toolbar-btn {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.625rem 1rem;
      background: #334155;
      border: none;
      border-radius: 8px;
      color: #e2e8f0;
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
    }

    .toolbar-btn:hover {
      background: #475569;
    }

    .toolbar-btn.primary {
      background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
    }

    .toolbar-btn.primary:hover {
      background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
    }

    .loading-state, .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 4rem 2rem;
      color: #64748b;
    }

    .spinner {
      width: 40px;
      height: 40px;
      border: 3px solid #334155;
      border-top-color: #3b82f6;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-bottom: 1rem;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .empty-icon {
      font-size: 3rem;
      margin-bottom: 1rem;
      opacity: 0.5;
    }

    .empty-state h3 {
      color: #94a3b8;
      margin-bottom: 0.5rem;
    }

    .table-wrapper {
      overflow-x: auto;
    }

    .data-table {
      width: 100%;
      border-collapse: collapse;
    }

    .data-table th {
      text-align: left;
      padding: 1rem 1.25rem;
      background: #0f172a;
      color: #94a3b8;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border-bottom: 1px solid #334155;
    }

    .data-table th.sortable {
      cursor: pointer;
      user-select: none;
    }

    .data-table th.sortable:hover {
      color: #e2e8f0;
    }

    .sort-indicator {
      margin-left: 0.5rem;
      color: #3b82f6;
    }

    .data-table td {
      padding: 1rem 1.25rem;
      color: #e2e8f0;
      font-size: 0.875rem;
      border-bottom: 1px solid #334155;
    }

    .data-table tr:hover {
      background: #1e293b;
    }

    .data-table tr.editing {
      background: #1e293b;
    }

    .edit-input {
      width: 100%;
      padding: 0.5rem;
      background: #0f172a;
      border: 1px solid #3b82f6;
      border-radius: 4px;
      color: #e2e8f0;
      font-size: 0.875rem;
    }

    .edit-input:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
    }

    .actions-cell {
      display: flex;
      gap: 0.5rem;
    }

    .action-btn {
      width: 32px;
      height: 32px;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-size: 0.875rem;
      transition: all 0.2s;
    }

    .action-btn.edit {
      background: #3b82f620;
      color: #3b82f6;
    }

    .action-btn.edit:hover {
      background: #3b82f6;
      color: white;
    }

    .action-btn.delete {
      background: #ef444420;
      color: #ef4444;
    }

    .action-btn.delete:hover {
      background: #ef4444;
      color: white;
    }

    .action-btn.view {
      background: #10b98120;
      color: #10b981;
    }

    .action-btn.view:hover {
      background: #10b981;
      color: white;
    }

    .pagination {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 1.25rem;
      background: #0f172a;
      border-top: 1px solid #334155;
    }

    .page-info {
      font-size: 0.875rem;
      color: #64748b;
    }

    .page-buttons {
      display: flex;
      gap: 0.5rem;
    }

    .page-btn {
      padding: 0.5rem 0.75rem;
      background: #334155;
      border: none;
      border-radius: 6px;
      color: #e2e8f0;
      font-size: 0.875rem;
      cursor: pointer;
      transition: all 0.2s;
    }

    .page-btn:hover:not(:disabled) {
      background: #475569;
    }

    .page-btn.active {
      background: #3b82f6;
    }

    .page-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  `]})],b);let u=class{constructor(){this.minLevel="info",this.maxEntries=100,this.logs=(0,s.vPA)([]),this.stats=(0,s.vPA)({total:0,debug:0,info:0,warn:0,error:0}),this.allLogs=this.logs.asReadonly(),this.logStats=this.stats.asReadonly(),this.errorLogs=(0,l.EW)(()=>this.logs().filter(e=>"error"===e.level)),this.warnLogs=(0,l.EW)(()=>this.logs().filter(e=>"warn"===e.level)),this.recentLogs=(0,l.EW)(()=>this.logs().slice(-20)),this.hasErrors=(0,l.EW)(()=>this.stats().error>0),this.logCount=(0,l.EW)(()=>this.stats().total),this.levelOrder={debug:0,info:1,warn:2,error:3},(0,s.QZP)(()=>{let e=this.logs();e.length>this.maxEntries&&this.logs.set(e.slice(-this.maxEntries))})}shouldLog(e){return this.levelOrder[e]>=this.levelOrder[this.minLevel]}addLog(e,t,r,a){if(!this.shouldLog(e))return;let s={level:e,message:t,data:r,timestamp:Date.now(),source:a};this.logs.update(e=>[...e,s]),this.updateStats(e);let i=new Date(s.timestamp).toLocaleTimeString(),o=`[${i}] [${e.toUpperCase()}] ${t}`;switch(e){case"debug":console.debug(o,r??"");break;case"info":console.info(o,r??"");break;case"warn":console.warn(o,r??"");break;case"error":console.error(o,r??"")}}updateStats(e){this.stats.update(t=>({...t,total:t.total+1,[e]:t[e]+1}))}debug(e,t,r){this.addLog("debug",e,t,r)}info(e,t,r){this.addLog("info",e,t,r)}warn(e,t,r){this.addLog("warn",e,t,r)}error(e,t,r){this.addLog("error",e,t,r)}getLogsByLevel(e){return this.logs().filter(t=>t.level===e)}getLogsSince(e){return this.logs().filter(t=>t.timestamp>=e)}getLogsBySource(e){return this.logs().filter(t=>t.source===e)}searchLogs(e){let t=e.toLowerCase();return this.logs().filter(e=>e.message.toLowerCase().includes(t))}exportLogs(){return JSON.stringify(this.logs(),null,2)}clearLogs(){this.logs.set([]),this.stats.set({total:0,debug:0,info:0,warn:0,error:0})}clearErrors(){this.logs.update(e=>e.filter(e=>"error"!==e.level)),this.stats.update(e=>({...e,total:e.total-e.error,error:0}))}setMinLevel(e){Object.assign(this,{minLevel:e})}};u=((e,t,r,a)=>{for(var s,i=t,o=e.length-1;o>=0;o--)(s=e[o])&&(i=s(i)||i);return i})([(0,i._qm)({providedIn:"root"})],u);let h=class{constructor(){this.notifications=(0,s.vPA)([]),this.items=this.notifications}show(e,t="info",r=3e3){let a={id:Math.random().toString(36).slice(2),type:t,message:e,duration:r};this.notifications.update(e=>[...e,a]),r>0&&setTimeout(()=>this.dismiss(a.id),r)}success(e,t=3e3){this.show(e,"success",t)}error(e,t=5e3){this.show(e,"error",t)}info(e,t=3e3){this.show(e,"info",t)}warning(e,t=4e3){this.show(e,"warning",t)}dismiss(e){this.notifications.update(t=>t.filter(t=>t.id!==e))}clear(){this.notifications.set([])}};h=((e,t,r,a)=>{for(var s,i=t,o=e.length-1;o>=0;o--)(s=e[o])&&(i=s(i)||i);return i})([(0,i._qm)({providedIn:"root"})],h);let m=class{constructor(){this.defaultTimeout=3e4,this.loading=(0,s.vPA)(!1),this.error=(0,s.vPA)(null),this.lastCallTime=(0,s.vPA)(null),this.callCount=(0,s.vPA)(0),this.isLoading=this.loading.asReadonly(),this.error$=this.error.asReadonly(),this.lastCallTime$=this.lastCallTime.asReadonly(),this.callCount$=this.callCount.asReadonly(),this.hasError=(0,l.EW)(()=>null!==this.error()),this.isReady=(0,l.EW)(()=>!this.loading()&&null===this.error())}async call(e,t=[],r){this.loading.set(!0),this.error.set(null),this.callCount.update(e=>e+1);let a=r?.timeoutMs??this.defaultTimeout;return new Promise((r,s)=>{let i=setTimeout(()=>{this.loading.set(!1),this.error.set(`Request timeout after ${a}ms`),s({success:!1,error:`Request timeout after ${a}ms`})},a);try{let a=window.webui;if(!a||"function"!=typeof a.call){clearTimeout(i),this.loading.set(!1),this.error.set("WebUI bridge not available"),s({success:!1,error:"WebUI bridge not available"});return}let o=t.map(e=>"object"==typeof e?JSON.stringify(e):String(e));a.call(e,...o).then(e=>{clearTimeout(i),this.loading.set(!1),this.lastCallTime.set(Date.now());try{let t=JSON.parse(e);t.success||this.error.set(t.error??"Unknown error"),r({success:t.success,data:t.data,error:t.error})}catch(t){r({success:!0,data:e})}}).catch(e=>{clearTimeout(i),this.loading.set(!1);let t=e.message||"Unknown error";this.error.set(t),s({success:!1,error:t})})}catch(t){clearTimeout(i),this.loading.set(!1);let e=t instanceof Error?t.message:String(t);this.error.set(e),s({success:!1,error:e})}})}async callOrThrow(e,t=[]){let r=await this.call(e,t);if(!r.success)throw Error(r.error??"Unknown error");return r.data}clearError(){this.error.set(null)}reset(){this.loading.set(!1),this.error.set(null),this.lastCallTime.set(null),this.callCount.set(0)}};m=((e,t,r,a)=>{for(var s,i=t,o=e.length-1;o>=0;o--)(s=e[o])&&(i=s(i)||i);return i})([(0,i._qm)({providedIn:"root"})],m);let g=class{constructor(){this.logger=(0,s.WQX)(u),this.notifications=(0,s.WQX)(h),this.api=(0,s.WQX)(m),this.isLoading=(0,s.vPA)(!1),this.stats=(0,s.vPA)({total_users:0,today_count:0,unique_domains:0}),this.users=(0,s.vPA)([]),this.showForm=(0,s.vPA)(!1),this.editingUser=(0,s.vPA)(null),this.formData={name:"",email:"",age:25},this.columns=[{key:"name",label:"Name",sortable:!0},{key:"email",label:"Email",type:"email",sortable:!0},{key:"age",label:"Age",type:"number",sortable:!0,width:"100px"},{key:"created_at",label:"Created",type:"date",sortable:!0,width:"150px"}],this.actions=[{id:"edit",icon:"✏️",label:"Edit",color:"#3b82f6"},{id:"delete",icon:"\uD83D\uDDD1️",label:"Delete",color:"#ef4444"}]}ngOnInit(){this.loadUsers()}async loadUsers(){this.isLoading.set(!0);try{let[e,t]=await Promise.all([this.api.callOrThrow("getUsers"),this.api.callOrThrow("getUserStats")]);this.users.set(e),this.stats.set(t)}catch(e){this.notifications.error("Failed to load users"),this.logger.error("Load users error",e)}finally{this.isLoading.set(!1)}}openAddForm(){this.editingUser.set(null),this.formData={name:"",email:"",age:25},this.showForm.set(!0)}openEditForm(e){this.editingUser.set(e),this.formData={...e},this.showForm.set(!0)}closeForm(){this.showForm.set(!1),this.editingUser.set(null),this.formData={name:"",email:"",age:25}}async saveUser(){if(!this.formData.name||!this.formData.email||!this.formData.age)return void this.notifications.error("Please fill in all fields");let e=null!==this.editingUser();this.isLoading.set(!0);try{e?(await this.api.callOrThrow("updateUser",[this.formData]),this.notifications.success("User updated successfully")):(await this.api.callOrThrow("createUser",[this.formData]),this.notifications.success("User created successfully")),this.closeForm(),await this.loadUsers()}catch(t){this.notifications.error(e?"Failed to update user":"Failed to create user"),this.logger.error("Save user error",t)}finally{this.isLoading.set(!1)}}confirmDelete(e){confirm(`Are you sure you want to delete ${e.name}?`)&&this.deleteUser(e)}async deleteUser(e){this.isLoading.set(!0);try{await this.api.callOrThrow("deleteUser",[e.id]),this.notifications.success("User deleted"),await this.loadUsers()}catch(e){this.notifications.error("Failed to delete user"),this.logger.error("Delete user error",e)}finally{this.isLoading.set(!1)}}};g=((e,t,r,a)=>{for(var s,i=t,o=e.length-1;o>=0;o--)(s=e[o])&&(i=s(i)||i);return i})([(0,i.uAl)({selector:"app-sqlite-crud",standalone:!0,imports:[o.MD,n.YN,b],template:`
    <div class="crud-wrapper">
      <div class="stats-cards">
        <div class="stat-card">
          <div class="stat-icon" style="background: #3b82f6;">\u{1F465}</div>
          <div class="stat-content">
            <span class="stat-value">{{ stats().total_users }}</span>
            <span class="stat-label">Total Users</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background: #10b981;">\u{1F4C5}</div>
          <div class="stat-content">
            <span class="stat-value">{{ stats().today_count }}</span>
            <span class="stat-label">Added Today</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background: #8b5cf6;">\u{1F310}</div>
          <div class="stat-content">
            <span class="stat-value">{{ stats().unique_domains }}</span>
            <span class="stat-label">Email Domains</span>
          </div>
        </div>
      </div>

      @if (showForm()) {
        <div class="form-modal">
          <div class="form-container">
            <div class="form-header">
              <h2>{{ editingUser() ? 'Edit User' : 'Add New User' }}</h2>
              <button class="close-btn" (click)="closeForm()">\xd7</button>
            </div>
            <form class="crud-form" (ngSubmit)="saveUser()">
              <div class="form-row">
                <div class="form-group">
                  <label>Name</label>
                  <input type="text" [(ngModel)]="formData.name" name="name" required placeholder="Enter name">
                </div>
                <div class="form-group">
                  <label>Email</label>
                  <input type="email" [(ngModel)]="formData.email" name="email" required placeholder="Enter email">
                </div>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label>Age</label>
                  <input type="number" [(ngModel)]="formData.age" name="age" required min="1" max="150" placeholder="Enter age">
                </div>
              </div>
              <div class="form-actions">
                <button type="button" class="btn-cancel" (click)="closeForm()">Cancel</button>
                <button type="submit" class="btn-submit" [disabled]="isLoading()">
                  {{ isLoading() ? 'Saving...' : (editingUser() ? 'Update' : 'Create') }}
                </button>
              </div>
            </form>
          </div>
        </div>
      }

      <app-data-table
        [data]="users()"
        [columns]="columns"
        [actions]="actions"
        [loading]="isLoading()"
        emptyMessage="No users found. Add a new user to get started."
        (refresh)="loadUsers()"
        (add)="openAddForm()"
        (edit)="openEditForm($event)"
        (delete)="confirmDelete($event)" />
    </div>
  `,styles:[`
    .crud-wrapper {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .stats-cards {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
    }

    .stat-card {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1.25rem;
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 12px;
    }

    .stat-icon {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.25rem;
    }

    .stat-content {
      display: flex;
      flex-direction: column;
    }

    .stat-value {
      font-size: 1.5rem;
      font-weight: 700;
      color: #f8fafc;
    }

    .stat-label {
      font-size: 0.75rem;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .form-modal {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.7);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }

    .form-container {
      background: #1e293b;
      border-radius: 16px;
      border: 1px solid #334155;
      width: 100%;
      max-width: 500px;
      overflow: hidden;
    }

    .form-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.25rem 1.5rem;
      background: #0f172a;
      border-bottom: 1px solid #334155;
    }

    .form-header h2 {
      margin: 0;
      font-size: 1.25rem;
      color: #f8fafc;
    }

    .close-btn {
      background: none;
      border: none;
      color: #64748b;
      font-size: 1.5rem;
      cursor: pointer;
      padding: 0;
      line-height: 1;
    }

    .close-btn:hover {
      color: #e2e8f0;
    }

    .crud-form {
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .form-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .form-group label {
      font-size: 0.875rem;
      font-weight: 500;
      color: #94a3b8;
    }

    .form-group input {
      padding: 0.75rem 1rem;
      background: #0f172a;
      border: 1px solid #334155;
      border-radius: 8px;
      color: #e2e8f0;
      font-size: 0.875rem;
    }

    .form-group input:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
    }

    .form-group input::placeholder {
      color: #64748b;
    }

    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      margin-top: 0.5rem;
    }

    .btn-cancel {
      padding: 0.75rem 1.25rem;
      background: #334155;
      border: none;
      border-radius: 8px;
      color: #e2e8f0;
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-cancel:hover {
      background: #475569;
    }

    .btn-submit {
      padding: 0.75rem 1.25rem;
      background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
      border: none;
      border-radius: 8px;
      color: white;
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-submit:hover:not(:disabled) {
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
    }

    .btn-submit:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  `]})],g);let f=class{constructor(){this.sidebarCollapsed=(0,s.vPA)(!1),this.drawerOpen=(0,s.vPA)(!1),this.activeTable=(0,s.vPA)("users"),this.searchQuery=(0,s.vPA)(""),this.menuItems=[{id:"users",label:"Users",icon:"\uD83D\uDC65",color:"#3b82f6"},{id:"products",label:"Products",icon:"\uD83D\uDCE6",color:"#10b981"},{id:"orders",label:"Orders",icon:"\uD83D\uDED2",color:"#f59e0b"},{id:"categories",label:"Categories",icon:"\uD83C\uDFF7️",color:"#8b5cf6"}]}get filteredMenuItems(){let e=this.searchQuery().toLowerCase().trim();return e?this.menuItems.filter(t=>{let r=t.label.toLowerCase();return this.fuzzyMatch(e,r)}):this.menuItems}fuzzyMatch(e,t){let r=0;for(let a=0;a<t.length&&r<e.length;a++)t[a]===e[r]&&r++;return r===e.length}toggleSidebar(){this.sidebarCollapsed.update(e=>!e)}openDrawer(){this.drawerOpen.set(!0)}closeDrawer(){this.drawerOpen.set(!1)}onSearchInput(e){let t=e.target;this.searchQuery.set(t.value)}clearSearch(){this.searchQuery.set("")}selectMenuItem(e){this.activeTable.set(e),this.closeDrawer()}setActiveTable(e){this.activeTable.set(e)}getActiveTableLabel(){let e=this.menuItems.find(e=>e.id===this.activeTable());return e?.label||"Dashboard"}refreshData(){window.location.reload()}};f=((e,t,r,a)=>{for(var s,i=t,o=e.length-1;o>=0;o--)(s=e[o])&&(i=s(i)||i);return i})([(0,i.uAl)({selector:"app-root",standalone:!0,imports:[o.MD,g],template:`
    <div class="app-container">
      <aside class="sidebar" [class.collapsed]="sidebarCollapsed()" [class.mobile-hidden]="drawerOpen()">
        <div class="app-identity">
          <div class="app-logo">
            <span class="logo-icon">\u{1F986}</span>
          </div>
          @if (!sidebarCollapsed()) {
            <div class="app-info">
              <h2 class="app-name">Select a Topic</h2>
              <p class="app-tagline">WebUI Dashboard</p>
            </div>
          }
        </div>

        @if (!sidebarCollapsed()) {
          <div class="search-section">
            <div class="search-box">
              <span class="search-icon">\u{1F50D}</span>
              <input
                type="text"
                class="search-input"
                placeholder="Fuzzy search topics..."
                [value]="searchQuery()"
                (input)="onSearchInput($event)"
              />
              @if (searchQuery()) {
                <button class="search-clear" (click)="clearSearch()">
                  <span>\u2715</span>
                </button>
              }
            </div>
          </div>
        }

        <div class="sidebar-header">
          <div class="brand">
            <span class="brand-icon">\u{1F5C4}\uFE0F</span>
            @if (!sidebarCollapsed()) {
              <span class="brand-text">DuckDB CRUD</span>
            }
          </div>
          <button class="collapse-btn" (click)="toggleSidebar()">
            <span>{{ sidebarCollapsed() ? '\u2192' : '\u2190' }}</span>
          </button>
        </div>

        <nav class="sidebar-nav">
          @for (item of filteredMenuItems(); track item.id) {
            <button
              type="button"
              class="nav-item"
              [class.active]="activeTable() === item.id"
              (click)="selectMenuItem(item.id)"
              [title]="sidebarCollapsed() ? item.label : ''">
              <span class="nav-icon" [style.background]="item.color">{{ item.icon }}</span>
              @if (!sidebarCollapsed()) {
                <span class="nav-label">{{ item.label }}</span>
              }
            </button>
          }
          @if (filteredMenuItems().length === 0) {
            <div class="no-results">
              <span class="no-results-icon">\u{1F50D}</span>
              <p>No topics found</p>
            </div>
          }
        </nav>

        <div class="sidebar-footer">
          <div class="db-status">
            <span class="status-dot"></span>
            @if (!sidebarCollapsed()) {
              <span class="status-text">Database Connected</span>
            }
          </div>
        </div>
      </aside>

      <main class="main-content">
        <header class="content-header">
          <div class="header-title">
            <button class="mobile-menu-btn mobile-only" (click)="openDrawer()">
              <span class="hamburger-icon"></span>
            </button>
            <div class="header-title-content">
              <h1>{{ getActiveTableLabel() }}</h1>
              <span class="table-badge">{{ activeTable() }}</span>
            </div>
          </div>
          <div class="header-actions">
            <button class="action-btn refresh" (click)="refreshData()">
              <span>\u{1F504}</span> Refresh
            </button>
          </div>
        </header>

        <div class="content-body">
          @switch (activeTable()) {
            @case ('users') {
              <app-sqlite-crud />
            }
            @case ('products') {
              <div class="coming-soon">
                <span class="coming-icon">\u{1F4E6}</span>
                <h2>Products Table</h2>
                <p>Product management coming soon...</p>
              </div>
            }
            @case ('orders') {
              <div class="coming-soon">
                <span class="coming-icon">\u{1F6D2}</span>
                <h2>Orders Table</h2>
                <p>Order management coming soon...</p>
              </div>
            }
            @case ('categories') {
              <div class="coming-soon">
                <span class="coming-icon">\u{1F3F7}\uFE0F</span>
                <h2>Categories Table</h2>
                <p>Category management coming soon...</p>
              </div>
            }
            @default {
              <div class="coming-soon">
                <span class="coming-icon">\u{1F4CA}</span>
                <h2>Select a Table</h2>
                <p>Choose a table from the sidebar to start managing data</p>
              </div>
            }
          }
        </div>
      </main>

      <!-- Mobile Sliding-Up Drawer -->
      <div class="drawer-backdrop mobile-only" [class.visible]="drawerOpen()" (click)="closeDrawer()"></div>
      <div class="drawer mobile-only" [class.open]="drawerOpen()">
        <div class="drawer-header">
          <div class="drawer-brand">
            <span class="drawer-icon">\u{1F5C4}\uFE0F</span>
            <span class="drawer-title">DuckDB CRUD</span>
          </div>
          <button class="drawer-close" (click)="closeDrawer()">
            <span>\u2715</span>
          </button>
        </div>
        <nav class="drawer-nav">
          @for (item of filteredMenuItems(); track item.id) {
            <button
              type="button"
              class="drawer-item"
              [class.active]="activeTable() === item.id"
              (click)="selectMenuItem(item.id)">
              <span class="drawer-item-icon" [style.background]="item.color">{{ item.icon }}</span>
              <span class="drawer-item-label">{{ item.label }}</span>
              @if (activeTable() === item.id) {
                <span class="drawer-item-check">\u2713</span>
              }
            </button>
          }
          @if (filteredMenuItems().length === 0) {
            <div class="drawer-no-results">
              <span class="drawer-no-results-icon">\u{1F50D}</span>
              <p>No topics found</p>
            </div>
          }
        </nav>
        <div class="drawer-footer">
          <div class="drawer-db-status">
            <span class="drawer-status-dot"></span>
            <span class="drawer-status-text">Database Connected</span>
          </div>
        </div>
      </div>
    </div>
  `,styles:[`
    :host {
      display: block;
      height: 100vh;
      width: 100%;
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
    }

    .app-container {
      display: flex;
      height: 100%;
      background: #0f172a;
      color: #e2e8f0;
    }

    .sidebar {
      width: 260px;
      min-width: 260px;
      background: #1e293b;
      display: flex;
      flex-direction: column;
      border-right: 1px solid #334155;
      transition: all 0.3s ease;
    }

    .sidebar.collapsed {
      width: 72px;
      min-width: 72px;
    }

    /* App Identity Section */
    .app-identity {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1.5rem 1rem 1.25rem;
      border-bottom: 1px solid #334155;
    }

    .app-logo {
      flex-shrink: 0;
      width: 48px;
      height: 48px;
      border-radius: 12px;
      background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
    }

    .logo-icon {
      font-size: 1.75rem;
    }

    .app-info {
      flex: 1;
      overflow: hidden;
    }

    .app-name {
      font-size: 1.1rem;
      font-weight: 700;
      color: #f8fafc;
      margin: 0;
      letter-spacing: -0.025em;
    }

    .app-tagline {
      font-size: 0.75rem;
      color: #64748b;
      margin: 0.25rem 0 0;
      font-weight: 500;
    }

    /* Search Section */
    .search-section {
      padding: 1rem 1rem 0;
    }

    .search-box {
      position: relative;
      display: flex;
      align-items: center;
    }

    .search-icon {
      position: absolute;
      left: 0.75rem;
      font-size: 1rem;
      opacity: 0.5;
      pointer-events: none;
    }

    .search-input {
      width: 100%;
      padding: 0.625rem 2.5rem 0.625rem 2.25rem;
      background: #0f172a;
      border: 1px solid #334155;
      border-radius: 10px;
      color: #e2e8f0;
      font-size: 0.875rem;
      outline: none;
      transition: all 0.2s;
    }

    .search-input:focus {
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    .search-input::placeholder {
      color: #64748b;
    }

    .search-clear {
      position: absolute;
      right: 0.5rem;
      background: #334155;
      border: none;
      color: #94a3b8;
      width: 22px;
      height: 22px;
      border-radius: 6px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
      font-size: 0.75rem;
      padding: 0;
    }

    .search-clear:hover {
      background: #475569;
      color: #e2e8f0;
    }

    .no-results {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 2rem 1rem;
      text-align: center;
      color: #64748b;
    }

    .no-results-icon {
      font-size: 2rem;
      margin-bottom: 0.5rem;
      opacity: 0.5;
    }

    .no-results p {
      font-size: 0.875rem;
      margin: 0;
    }

    .sidebar-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1.25rem 1rem;
      border-bottom: 1px solid #334155;
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .brand-icon {
      font-size: 1.5rem;
    }

    .brand-text {
      font-size: 1.1rem;
      font-weight: 600;
      color: #f8fafc;
    }

    .collapse-btn {
      background: #334155;
      border: none;
      color: #94a3b8;
      width: 28px;
      height: 28px;
      border-radius: 6px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
    }

    .collapse-btn:hover {
      background: #475569;
      color: #e2e8f0;
    }

    .sidebar-nav {
      flex: 1;
      padding: 1rem 0.75rem;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      overflow-y: auto;
    }

    .nav-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.875rem 1rem;
      background: transparent;
      border: none;
      border-radius: 10px;
      color: #94a3b8;
      cursor: pointer;
      transition: all 0.2s;
      text-align: left;
    }

    .nav-item:hover {
      background: #334155;
      color: #e2e8f0;
    }

    .nav-item.active {
      background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
      color: #ffffff;
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
    }

    .nav-icon {
      width: 32px;
      height: 32px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1rem;
      flex-shrink: 0;
    }

    .nav-label {
      font-size: 0.9rem;
      font-weight: 500;
      white-space: nowrap;
    }

    .sidebar-footer {
      padding: 1rem;
      border-top: 1px solid #334155;
    }

    .db-status {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem;
      background: #0f172a;
      border-radius: 8px;
    }

    .status-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #10b981;
      box-shadow: 0 0 8px rgba(16, 185, 129, 0.5);
    }

    .status-text {
      font-size: 0.75rem;
      color: #64748b;
    }

    .main-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .content-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1.5rem 2rem;
      background: #1e293b;
      border-bottom: 1px solid #334155;
    }

    .header-title {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .header-title h1 {
      font-size: 1.5rem;
      font-weight: 600;
      color: #f8fafc;
      margin: 0;
    }

    .table-badge {
      padding: 0.25rem 0.75rem;
      background: #334155;
      border-radius: 20px;
      font-size: 0.75rem;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .header-actions {
      display: flex;
      gap: 0.75rem;
    }

    .action-btn {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.625rem 1rem;
      background: #334155;
      border: none;
      border-radius: 8px;
      color: #e2e8f0;
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
    }

    .action-btn:hover {
      background: #475569;
    }

    .content-body {
      flex: 1;
      padding: 2rem;
      overflow-y: auto;
    }

    .coming-soon {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      text-align: center;
      color: #64748b;
    }

    .coming-icon {
      font-size: 4rem;
      margin-bottom: 1.5rem;
      opacity: 0.5;
    }

    .coming-soon h2 {
      font-size: 1.5rem;
      color: #94a3b8;
      margin-bottom: 0.5rem;
    }

    .coming-soon p {
      font-size: 1rem;
    }

    /* Mobile menu button (hamburger) */
    .mobile-menu-btn {
      display: none;
      background: transparent;
      border: none;
      cursor: pointer;
      padding: 0.5rem;
      margin-right: 0.75rem;
    }

    .hamburger-icon {
      display: block;
      width: 24px;
      height: 2px;
      background: #e2e8f0;
      position: relative;
      border-radius: 2px;
    }

    .hamburger-icon::before,
    .hamburger-icon::after {
      content: '';
      position: absolute;
      width: 24px;
      height: 2px;
      background: #e2e8f0;
      border-radius: 2px;
      left: 0;
    }

    .hamburger-icon::before {
      top: -7px;
    }

    .hamburger-icon::after {
      top: 7px;
    }

    .header-title-content {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    /* Mobile-only utility class */
    .mobile-only {
      display: none;
    }

    /* Sidebar hidden on mobile when drawer is open */
    .sidebar.mobile-hidden {
      transform: translateX(-100%);
    }

    /* Drawer Backdrop */
    .drawer-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.6);
      backdrop-filter: blur(4px);
      z-index: 199;
      opacity: 0;
      visibility: hidden;
      transition: opacity 0.3s ease, visibility 0.3s ease;
    }

    .drawer-backdrop.visible {
      opacity: 1;
      visibility: visible;
    }

    /* Sliding-Up Drawer */
    .drawer {
      position: fixed;
      left: 0;
      right: 0;
      bottom: 0;
      background: #1e293b;
      border-top-left-radius: 16px;
      border-top-right-radius: 16px;
      z-index: 200;
      transform: translateY(100%);
      transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: 0 -4px 24px rgba(0, 0, 0, 0.4);
      max-height: 80vh;
      display: flex;
      flex-direction: column;
    }

    .drawer.open {
      transform: translateY(0);
    }

    .drawer-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid #334155;
    }

    .drawer-brand {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .drawer-icon {
      font-size: 1.5rem;
    }

    .drawer-title {
      font-size: 1.1rem;
      font-weight: 600;
      color: #f8fafc;
    }

    .drawer-close {
      background: #334155;
      border: none;
      color: #94a3b8;
      width: 36px;
      height: 36px;
      border-radius: 8px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
      font-size: 1.2rem;
    }

    .drawer-close:hover {
      background: #475569;
      color: #e2e8f0;
    }

    .drawer-nav {
      flex: 1;
      padding: 1rem 1rem;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .drawer-item {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem 1.25rem;
      background: transparent;
      border: none;
      border-radius: 12px;
      color: #94a3b8;
      cursor: pointer;
      transition: all 0.2s;
      text-align: left;
      width: 100%;
    }

    .drawer-item:hover {
      background: #334155;
      color: #e2e8f0;
    }

    .drawer-item.active {
      background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
      color: #ffffff;
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
    }

    .drawer-item-icon {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.2rem;
      flex-shrink: 0;
    }

    .drawer-item-label {
      flex: 1;
      font-size: 1rem;
      font-weight: 500;
    }

    .drawer-item-check {
      font-size: 1.2rem;
      opacity: 0.8;
    }

    .drawer-footer {
      padding: 1rem 1.5rem;
      border-top: 1px solid #334155;
    }

    .drawer-db-status {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem;
      background: #0f172a;
      border-radius: 10px;
    }

    .drawer-status-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: #10b981;
      box-shadow: 0 0 8px rgba(16, 185, 129, 0.5);
    }

    .drawer-status-text {
      font-size: 0.875rem;
      color: #64748b;
    }

    .drawer-no-results {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 2rem 1rem;
      text-align: center;
      color: #64748b;
    }

    .drawer-no-results-icon {
      font-size: 2rem;
      margin-bottom: 0.5rem;
      opacity: 0.5;
    }

    .drawer-no-results p {
      font-size: 0.875rem;
      margin: 0;
    }

    @media (max-width: 768px) {
      .mobile-only {
        display: block;
      }

      .mobile-menu-btn {
        display: block;
      }

      .header-title {
        gap: 0;
      }

      .sidebar {
        position: fixed;
        left: 0;
        top: 0;
        bottom: 0;
        z-index: 100;
        transform: translateX(-100%);
        transition: transform 0.3s ease;
      }

      .sidebar:not(.collapsed):not(.mobile-hidden) {
        transform: translateX(0);
      }

      .content-header {
        padding: 1rem;
      }

      .content-body {
        padding: 1rem;
      }
    }
  `]})],f);let v=console,w=window,x=new class{constructor(){this.subscribers=new Map}init(e,t){}publish(e,t){for(let r of this.subscribers.get(e)||new Set)r(t)}subscribe(e,t){this.subscribers.has(e)||this.subscribers.set(e,new Set),this.subscribers.get(e).add(t)}};x.init("app",300),w.__FRONTEND_EVENT_BUS__=x,v.info("Starting Angular bootstrap");try{(0,a.B8)(f,{providers:[]}).then(e=>{v.info("Angular bootstrap completed successfully"),window.addEventListener("error",e=>{e.preventDefault();let t=e.error??e.message??"Unknown error";v.error("Global error:",t)}),window.addEventListener("unhandledrejection",e=>{e.preventDefault();let t=e.reason??"Unknown rejection";v.error("Unhandled promise rejection:",t)}),x.publish("app:ready",{timestamp:Date.now()})}).catch(e=>{let t=e instanceof Error?e.message:String(e);v.error("Angular bootstrap failed:",t)})}catch(t){let e=t instanceof Error?t.message:String(t);v.error("Bootstrap threw synchronously:",e)}}},function(e){e.O(0,["301","34","355","439","454","474","577","606","943"],function(){return e(e.s=986)}),e.O()}]);
//# sourceMappingURL=main.18d3f3a52a846a8c.js.map