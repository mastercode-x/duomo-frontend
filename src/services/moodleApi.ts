// Servicios de API para Moodle Web Services
// Esta capa de servicios se comunica con el backend de Moodle o modo demo

import type { 
  User, Course, CourseDetail, Grade, Certificate, 
  Notification, Event, AuthResponse,
  StudentProgress, CourseStats, Statistic, DashboardData, TeacherDashboardData
} from '@/types';
import { demoAuth } from './demoAuth';

// Modo de autenticación
const AUTH_MODE = import.meta.env.VITE_AUTH_MODE || 'demo';

// Configuración de la API de Moodle
const MOODLE_API_URL = import.meta.env.VITE_MOODLE_API_URL || '/webservice/rest/server.php';
const MOODLE_TOKEN = import.meta.env.VITE_MOODLE_TOKEN || '';

// Cliente HTTP básico
class MoodleApiClient {
  private baseUrl: string;
  private token: string;

  constructor(baseUrl: string = MOODLE_API_URL, token: string = MOODLE_TOKEN) {
    this.baseUrl = baseUrl;
    this.token = token;
  }

  setToken(token: string) {
    this.token = token;
    localStorage.setItem('moodle_token', token);
  }

  getToken(): string {
    return this.token || localStorage.getItem('moodle_token') || '';
  }

  clearToken() {
    this.token = '';
    localStorage.removeItem('moodle_token');
    localStorage.removeItem('moodle_privatetoken');
  }

  private async request<T>(wsfunction: string, params: Record<string, any> = {}): Promise<T> {
    const token = this.getToken();
    
    const queryParams = new URLSearchParams({
      wstoken: token,
      wsfunction,
      moodlewsrestformat: 'json',
      ...params
    });

    const response = await fetch(`${this.baseUrl}?${queryParams.toString()}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    // Moodle devuelve errores con la propiedad 'error'
    if (data && data.error) {
      throw new Error(data.error);
    }

    // Moodle a veces devuelve errores en 'exception'
    if (data && data.exception) {
      throw new Error(data.message || 'Error en la API de Moodle');
    }

    return data;
  }

  private async post<T>(wsfunction: string, params: Record<string, any> = {}): Promise<T> {
    const token = this.getToken();
    
    const formData = new URLSearchParams();
    formData.append('wstoken', token);
    formData.append('wsfunction', wsfunction);
    formData.append('moodlewsrestformat', 'json');
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, String(value));
      }
    });

    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
      },
      body: formData.toString(),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (data && data.error) {
      throw new Error(data.error);
    }

    if (data && data.exception) {
      throw new Error(data.message || 'Error en la API de Moodle');
    }

    return data;
  }

  // ==================== AUTENTICACIÓN ====================

  async login(username: string, password: string): Promise<AuthResponse> {
    // Para login usamos el endpoint especial de token
    const loginUrl = import.meta.env.VITE_MOODLE_LOGIN_URL || '/login/token.php';
    const service = import.meta.env.VITE_MOODLE_SERVICE || 'moodle_mobile_app';
    
    const response = await fetch(`${loginUrl}?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}&service=${service}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    const data = await response.json();

    if (data.error) {
      return { error: data.error, errorcode: data.errorcode };
    }

    if (data.token) {
      this.setToken(data.token);
      if (data.privatetoken) {
        localStorage.setItem('moodle_privatetoken', data.privatetoken);
      }
      
      // Obtener información del usuario
      const userInfo = await this.getCurrentUser();
      return { token: data.token, privatetoken: data.privatetoken, user: userInfo };
    }

    return { error: 'Error desconocido en el login' };
  }

  async logout(): Promise<void> {
    // Moodle no tiene un endpoint específico de logout en WS
    // Solo limpiamos el token local
    this.clearToken();
  }

  // ==================== USUARIOS ====================

  async getCurrentUser(): Promise<User> {
    const data = await this.request<any>('core_webservice_get_site_info');
    
    // Transformar la respuesta al formato User
    return {
      id: data.userid,
      username: data.username,
      firstname: data.firstname,
      lastname: data.lastname,
      fullname: data.fullname,
      email: '', // Se obtiene con otra llamada
      profileimageurl: data.userpictureurl,
      roles: [], // Se obtienen con otra llamada
    };
  }

  async getUserProfile(userid?: number): Promise<User> {
    const data = await this.request<any[]>('core_user_get_course_user_profiles', {
      'userlist[0][userid]': userid || 0,
      'userlist[0][courseid]': 1, // Site course
    });
    
    return this.transformUser(data[0]);
  }

  async getUsersByField(field: string, values: string[]): Promise<User[]> {
    const params: Record<string, string> = { field };
    values.forEach((value, index) => {
      params[`values[${index}]`] = value;
    });
    
    const data = await this.request<any[]>('core_user_get_users_by_field', params);
    return data.map(user => this.transformUser(user));
  }

  async updateUser(user: Partial<User> & { id: number }): Promise<boolean> {
    const params: Record<string, any> = {
      'users[0][id]': user.id,
    };

    if (user.firstname) params['users[0][firstname]'] = user.firstname;
    if (user.lastname) params['users[0][lastname]'] = user.lastname;
    if (user.email) params['users[0][email]'] = user.email;
    if (user.description) params['users[0][description]'] = user.description;
    if (user.city) params['users[0][city]'] = user.city;
    if (user.country) params['users[0][country]'] = user.country;
    if (user.timezone) params['users[0][timezone]'] = user.timezone;
    if (user.phone1) params['users[0][phone1]'] = user.phone1;
    if (user.phone2) params['users[0][phone2]'] = user.phone2;
    if (user.address) params['users[0][address]'] = user.address;
    if (user.institution) params['users[0][institution]'] = user.institution;
    if (user.department) params['users[0][department]'] = user.department;

    await this.post('core_user_update_users', params);
    return true;
  }

  async uploadUserPicture(userid: number, file: File): Promise<string> {
    // Implementar subida de imagen
    const formData = new FormData();
    formData.append('file', file);
    formData.append('token', this.getToken());
    formData.append('filearea', 'draft');
    formData.append('itemid', '0');
    
    const uploadUrl = import.meta.env.VITE_MOODLE_UPLOAD_URL || '/webservice/upload.php';
    
    const response = await fetch(uploadUrl, {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();
    
    if (data && data[0] && data[0].itemid) {
      // Actualizar imagen de perfil con el draft file
      await this.post('core_user_update_picture', {
        draftitemid: data[0].itemid,
        userid,
      });
      return data[0].url;
    }

    throw new Error('Error al subir la imagen');
  }

  async changePassword(_userid: number, _currentPassword: string, _newPassword: string): Promise<boolean> {
    // Moodle no tiene un WS directo para cambiar contraseña
    // Esto requiere un plugin personalizado o usar el frontend de Moodle
    // Por ahora retornamos false indicando que no está implementado
    console.warn('Cambio de contraseña requiere implementación adicional');
    return false;
  }

  // ==================== CURSOS ====================

  async getUserCourses(userid?: number): Promise<Course[]> {
    const params: Record<string, any> = {};
    if (userid) params.userid = userid;
    
    const data = await this.request<any[]>('core_enrol_get_users_courses', params);
    return data.map(course => this.transformCourse(course));
  }

  async getCourses(options?: { page?: number; perpage?: number; search?: string; category?: number; sort?: string; order?: 'asc' | 'desc' }): Promise<Course[]> {
    const params: Record<string, any> = {};
    
    if (options?.search) {
      params.criterianame = 'search';
      params.criteriavalue = options.search;
    }
    
    const data = await this.request<any>('core_course_search_courses', params);
    return data.courses?.map((course: any) => this.transformCourse(course)) || [];
  }

  async getCourseById(courseid: number): Promise<CourseDetail> {
    const data = await this.request<any[]>('core_course_get_courses', {
      'options[ids][0]': courseid,
    });
    
    return this.transformCourseDetail(data[0]);
  }

  async getCourseContent(courseid: number): Promise<any[]> {
    const data = await this.request<any[]>('core_course_get_contents', { courseid });
    return data;
  }

  async getCategories(parent?: number): Promise<any[]> {
    const params: Record<string, any> = {};
    if (parent !== undefined) params.parent = parent;
    
    const data = await this.request<any[]>('core_course_get_categories', params);
    return data;
  }

  // ==================== CALIFICACIONES ====================

  async getUserGrades(courseid?: number, userid?: number): Promise<Grade[]> {
    const params: Record<string, any> = {};
    if (courseid) params.courseid = courseid;
    if (userid) params.userid = userid;
    
    const data = await this.request<any>('gradereport_user_get_grade_items', params);
    
    const grades: Grade[] = [];
    data.usergrades?.forEach((userGrade: any) => {
      userGrade.gradeitems?.forEach((item: any) => {
        grades.push({
          courseid: userGrade.courseid,
          coursename: userGrade.coursename,
          grade: item.gradeformatted ? parseFloat(item.gradeformatted) : undefined,
          rawgrade: item.graderaw,
          itemid: item.id,
          itemname: item.itemname,
          itemtype: item.itemtype,
          itemmodule: item.itemmodule,
          iteminstance: item.iteminstance,
          percentage: item.percentageformatted ? parseFloat(item.percentageformatted) : undefined,
          feedback: item.feedback,
          datesubmitted: item.datesubmitted,
          dategraded: item.dategraded,
        });
      });
    });
    
    return grades;
  }

  async getCourseGrades(courseid: number): Promise<Grade[]> {
    return this.getUserGrades(courseid);
  }

  // ==================== CERTIFICADOS ====================

  async getUserCertificates(userid?: number): Promise<Certificate[]> {
    // Esto requiere el plugin mod_certificate o mod_customcert
    // Implementación básica
    try {
      const data = await this.request<any[]>('mod_certificate_get_issues', { userid });
      return data.map(cert => ({
        id: cert.id,
        name: cert.name || 'Certificado',
        courseid: cert.course,
        issuedate: cert.timecreated,
        code: cert.code,
      }));
    } catch (error) {
      console.warn('Plugin de certificados no disponible');
      return [];
    }
  }

  async getCertificateDownloadUrl(certificateid: number): Promise<string> {
    // Implementar según el plugin de certificados usado
    return `${MOODLE_API_URL}/mod/certificate/view.php?id=${certificateid}`;
  }

  // ==================== ACTIVIDADES Y COMPLETADO ====================

  async getActivitiesCompletion(courseid: number, userid?: number): Promise<any[]> {
    const params: Record<string, any> = { courseid };
    if (userid) params.userid = userid;
    
    const data = await this.request<any>('core_completion_get_activities_completion_status', params);
    return data.statuses || [];
  }

  async getCourseCompletionStatus(courseid: number, userid?: number): Promise<any> {
    const params: Record<string, any> = { courseid };
    if (userid) params.userid = userid;
    
    const data = await this.request<any>('core_completion_get_course_completion_status', params);
    return data.completionstatus;
  }

  // ==================== NOTIFICACIONES ====================

  async getNotifications(userid?: number, limit: number = 10): Promise<Notification[]> {
    const params: Record<string, any> = { limit };
    if (userid) params.useridto = userid;
    
    try {
      const data = await this.request<any>('message_popup_get_popup_notifications', params);
      return data.notifications?.map((notif: any) => ({
        id: notif.id,
        useridfrom: notif.useridfrom,
        useridto: notif.useridto,
        subject: notif.subject,
        text: notif.text,
        contexturl: notif.contexturl,
        contexturlname: notif.contexturlname,
        timecreated: notif.timecreated,
        timeread: notif.timeread,
        read: notif.read,
        deleted: notif.deleted,
        iconurl: notif.iconurl,
        component: notif.component,
        eventtype: notif.eventtype,
      })) || [];
    } catch (error) {
      console.warn('Error al obtener notificaciones:', error);
      return [];
    }
  }

  async markNotificationRead(notificationid: number): Promise<boolean> {
    await this.post('core_message_mark_notification_read', { notificationid });
    return true;
  }

  // ==================== EVENTOS Y CALENDARIO ====================

  async getCalendarEvents(courseids?: number[], start?: number, end?: number): Promise<Event[]> {
    const params: Record<string, any> = {};
    
    if (courseids) {
      courseids.forEach((id, index) => {
        params[`events[courseids][${index}]`] = id;
      });
    }
    
    if (start) params['options[timeStart]'] = start;
    if (end) params['options[timeEnd]'] = end;
    
    const data = await this.request<any>('core_calendar_get_calendar_events', params);
    
    return data.events?.map((event: any) => ({
      id: event.id,
      name: event.name,
      description: event.description,
      eventtype: event.eventtype,
      timestart: event.timestart,
      timeduration: event.timeduration,
      timesort: event.timesort,
      visible: event.visible,
      modulename: event.modulename,
      instance: event.instance,
      courseid: event.courseid,
      groupid: event.groupid,
      userid: event.userid,
      uuid: event.uuid,
      sequence: event.sequence,
      subscriptionid: event.subscriptionid,
    })) || [];
  }

  async getUpcomingEvents(days: number = 30): Promise<Event[]> {
    const now = Math.floor(Date.now() / 1000);
    const end = now + (days * 24 * 60 * 60);
    
    return this.getCalendarEvents(undefined, now, end);
  }

  // ==================== ESTADÍSTICAS (SOLO PROFESORES) ====================

  async getCourseStatistics(courseid: number): Promise<CourseStats> {
    // Obtener información del curso
    const course = await this.getCourseById(courseid);
    
    // Obtener estudiantes inscritos
    const enrolledUsers = await this.request<any[]>('core_enrol_get_enrolled_users', { courseid });
    const students = enrolledUsers.filter(u => u.roles?.some((r: any) => r.shortname === 'student'));
    
    // Calcular estadísticas
    const totalstudents = students.length;
    const activestudents = students.filter((s: any) => {
      const lastaccess = s.lastcourseaccess || 0;
      const weekAgo = Math.floor(Date.now() / 1000) - (7 * 24 * 60 * 60);
      return lastaccess > weekAgo;
    }).length;
    
    return {
      courseid,
      coursename: course.fullname,
      totalstudents,
      activestudents,
      completedstudents: 0, // Calcular basado en completado
      averageprogress: course.progress || 0,
      completionrate: 0,
    };
  }

  async getStudentProgress(courseid: number): Promise<StudentProgress[]> {
    const enrolledUsers = await this.request<any[]>('core_enrol_get_enrolled_users', { courseid });
    const students = enrolledUsers.filter(u => u.roles?.some((r: any) => r.shortname === 'student'));
    
    const progressList: StudentProgress[] = [];
    
    for (const student of students) {
      try {
        const completion = await this.getCourseCompletionStatus(courseid, student.id);
        progressList.push({
          userid: student.id,
          userfullname: `${student.firstname} ${student.lastname}`,
          courseid,
          progress: completion?.completed ? 100 : 0,
          completedactivities: completion?.completions?.filter((c: any) => c.complete).length || 0,
          totalactivities: completion?.completions?.length || 0,
          timeenrolled: student.enrolledcourses?.[0]?.timecreated,
          lastaccess: student.lastcourseaccess,
        });
      } catch (error) {
        console.warn(`Error al obtener progreso del estudiante ${student.id}:`, error);
      }
    }
    
    return progressList;
  }

  async getGlobalStatistics(): Promise<Statistic[]> {
    // Obtener cursos del usuario
    const courses = await this.getUserCourses();
    
    // Calcular estadísticas globales
    const totalCourses = courses.length;
    const totalStudents = courses.reduce((sum, c) => sum + (c.enrolledusercount || 0), 0);
    const averageProgress = courses.reduce((sum, c) => sum + (c.progress || 0), 0) / (totalCourses || 1);
    
    return [
      { name: 'total_courses', value: totalCourses, label: 'Total de Cursos' },
      { name: 'total_students', value: totalStudents, label: 'Total de Estudiantes' },
      { name: 'average_progress', value: Math.round(averageProgress), label: 'Progreso Promedio', trend: 'up' },
      { name: 'active_courses', value: courses.filter(course => course.lastaccess && (Date.now() / 1000 - course.lastaccess) < 7 * 24 * 60 * 60).length, label: 'Cursos Activos' },
    ];
  }

  // ==================== DASHBOARD ====================

  async getStudentDashboard(userid?: number): Promise<DashboardData> {
    const user = await this.getUserProfile(userid);
    const courses = await this.getUserCourses(userid);
    const certificates = await this.getUserCertificates(userid);
    const notifications = await this.getNotifications(userid);
    const upcomingEvents = await this.getUpcomingEvents(30);
    
    // Calcular progreso
    const totalCourses = courses.length;
    const completedCourses = courses.filter(c => c.completed).length;
    const inProgressCourses = totalCourses - completedCourses;
    const averageProgress = courses.reduce((sum, c) => sum + (c.progress || 0), 0) / (totalCourses || 1);
    
    return {
      user,
      courses,
      recentActivity: [], // Obtener de log de Moodle
      upcomingEvents,
      notifications,
      progress: {
        totalCourses,
        completedCourses,
        inProgressCourses,
        averageProgress: Math.round(averageProgress),
      },
      certificates,
    };
  }

  async getTeacherDashboard(userid?: number): Promise<TeacherDashboardData> {
    const baseDashboard = await this.getStudentDashboard(userid);
    
    // Obtener cursos que enseña el profesor
    const allCourses = await this.getUserCourses(userid);
    const teachingCourses = allCourses.filter(() => {
      // Filtrar cursos donde el usuario tiene rol de editingteacher
      return true; // Simplificado
    });
    
    // Obtener estadísticas de cada curso
    const courseStats: CourseStats[] = [];
    for (const course of teachingCourses) {
      try {
        const stats = await this.getCourseStatistics(course.id);
        courseStats.push(stats);
      } catch (error) {
        console.warn(`Error al obtener estadísticas del curso ${course.id}:`, error);
      }
    }
    
    return {
      ...baseDashboard,
      teachingCourses,
      courseStats,
      studentProgress: [], // Se carga por curso específico
      pendingGrading: [], // Implementar según plugin de tareas
      recentSubmissions: [],
    };
  }

  // ==================== TRANSFORMADORES ====================

  private transformUser(data: any): User {
    return {
      id: data.id,
      username: data.username,
      firstname: data.firstname,
      lastname: data.lastname,
      fullname: data.fullname,
      email: data.email,
      profileimageurl: data.profileimageurl,
      profileimageurlsmall: data.profileimageurlsmall,
      department: data.department,
      institution: data.institution,
      city: data.city,
      country: data.country,
      timezone: data.timezone,
      lang: data.lang,
      phone1: data.phone1,
      phone2: data.phone2,
      address: data.address,
      description: data.description,
      firstaccess: data.firstaccess,
      lastaccess: data.lastaccess,
      lastcourseaccess: data.lastcourseaccess,
      suspended: data.suspended,
      roles: data.roles?.map((r: any) => r.shortname) || [],
      preferences: data.preferences,
      customfields: data.customfields?.map((f: any) => ({
        name: f.name,
        value: f.value,
        type: f.type,
        shortname: f.shortname,
      })),
    };
  }

  private transformCourse(data: any): Course {
    return {
      id: data.id,
      shortname: data.shortname,
      fullname: data.fullname,
      displayname: data.displayname || data.fullname,
      summary: data.summary,
      summaryformat: data.summaryformat,
      categoryid: data.category,
      categoryname: data.categoryname,
      startdate: data.startdate,
      enddate: data.enddate,
      visible: data.visible !== 0,
      progress: data.progress,
      completed: data.completed,
      enrolledusercount: data.enrolledusercount,
      overviewfiles: data.overviewfiles,
      courseimage: data.overviewfiles?.[0]?.fileurl,
      completionhascriteria: data.completionhascriteria,
      completionusertracked: data.completionusertracked,
      lastaccess: data.lastaccess,
      isfavourite: data.isfavourite,
      hidden: data.hidden,
    };
  }

  private transformCourseDetail(data: any): CourseDetail {
    return {
      ...this.transformCourse(data),
      format: data.format,
      sections: data.contents?.map((section: any) => ({
        id: section.id,
        name: section.name,
        summary: section.summary,
        summaryformat: section.summaryformat,
        visible: section.visible,
        section: section.section,
        hiddenbynumsections: section.hiddenbynumsections,
        uservisible: section.uservisible,
        availabilityinfo: section.availabilityinfo,
        modules: section.modules?.map((mod: any) => ({
          id: mod.id,
          url: mod.url,
          name: mod.name,
          instance: mod.instance,
          contextid: mod.contextid,
          description: mod.description,
          visible: mod.visible,
          uservisible: mod.uservisible,
          visibleoncoursepage: mod.visibleoncoursepage,
          modicon: mod.modicon,
          modname: mod.modname,
          modplural: mod.modplural,
          availability: mod.availability,
          indent: mod.indent,
          onclick: mod.onclick,
          afterlink: mod.afterlink,
          customdata: mod.customdata,
          noviewlink: mod.noviewlink,
          completion: mod.completion,
          completiondata: mod.completiondata,
          dates: mod.dates,
        })),
      })),
    };
  }
}

// Instancia singleton del cliente
export const moodleApi = new MoodleApiClient();

// Exportar funciones individuales para conveniencia
export const login = (username: string, password: string) => {
  if (AUTH_MODE === 'demo') {
    return demoAuth.login(username, password);
  }
  return moodleApi.login(username, password);
};

export const logout = () => {
  if (AUTH_MODE === 'demo') {
    return demoAuth.logout();
  }
  return moodleApi.logout();
};

export const getCurrentUser = () => moodleApi.getCurrentUser();
export const getUserProfile = (userid?: number) => moodleApi.getUserProfile(userid);
export const getUserCourses = (userid?: number) => {
  if (AUTH_MODE === 'demo') {
    return Promise.resolve(demoAuth.getUserCourses());
  }
  return moodleApi.getUserCourses(userid);
};
export const getCourseById = (courseid: number) => {
  if (AUTH_MODE === 'demo') {
    const course = demoAuth.getCourseById(courseid);
    return Promise.resolve(course as CourseDetail);
  }
  return moodleApi.getCourseById(courseid);
};
export const getUserGrades = (courseid?: number, userid?: number) => moodleApi.getUserGrades(courseid, userid);
export const getUserCertificates = (userid?: number) => {
  if (AUTH_MODE === 'demo') {
    return Promise.resolve(demoAuth.getUserCertificates());
  }
  return moodleApi.getUserCertificates(userid);
};
export const getNotifications = (userid?: number, limit?: number) => moodleApi.getNotifications(userid, limit);
export const getStudentDashboard = (userid?: number) => {
  if (AUTH_MODE === 'demo') {
    const user = demoAuth.getCurrentUser();
    const courses = demoAuth.getUserCourses();
    const certificates = demoAuth.getUserCertificates();
    const events = demoAuth.getUpcomingEvents();
    
    const totalCourses = courses.length;
    const completedCourses = courses.filter(c => c.completed).length;
    const averageProgress = courses.reduce((sum, c) => sum + (c.progress || 0), 0) / (totalCourses || 1);
    
    return Promise.resolve({
      user: user!,
      courses,
      recentActivity: [],
      upcomingEvents: events,
      notifications: [],
      progress: {
        totalCourses,
        completedCourses,
        inProgressCourses: totalCourses - completedCourses,
        averageProgress: Math.round(averageProgress),
      },
      certificates,
    } as DashboardData);
  }
  return moodleApi.getStudentDashboard(userid);
};
export const getTeacherDashboard = (userid?: number) => {
  if (AUTH_MODE === 'demo') {
    const user = demoAuth.getCurrentUser();
    const courses = demoAuth.getUserCourses();
    const certificates = demoAuth.getUserCertificates();
    const events = demoAuth.getUpcomingEvents();
    const courseStats = demoAuth.getCourseStats();
    
    const totalCourses = courses.length;
    const completedCourses = courses.filter(c => c.completed).length;
    const averageProgress = courses.reduce((sum, c) => sum + (c.progress || 0), 0) / (totalCourses || 1);
    
    return Promise.resolve({
      user: user!,
      courses,
      recentActivity: [],
      upcomingEvents: events,
      notifications: [],
      progress: {
        totalCourses,
        completedCourses,
        inProgressCourses: totalCourses - completedCourses,
        averageProgress: Math.round(averageProgress),
      },
      certificates,
      teachingCourses: courses,
      courseStats,
      studentProgress: [],
      pendingGrading: [],
      recentSubmissions: [],
    } as TeacherDashboardData);
  }
  return moodleApi.getTeacherDashboard(userid);
};
export const getCourseStatistics = (courseid: number) => moodleApi.getCourseStatistics(courseid);
export const getGlobalStatistics = () => {
  if (AUTH_MODE === 'demo') {
    return Promise.resolve([
      { name: 'total_courses', value: 5, label: 'Total de Cursos' },
      { name: 'total_students', value: 120, label: 'Total de Estudiantes' },
      { name: 'average_progress', value: 68, label: 'Progreso Promedio', trend: 'up' as const },
      { name: 'active_courses', value: 4, label: 'Cursos Activos' },
    ] as Statistic[]);
  }
  return moodleApi.getGlobalStatistics();
};
