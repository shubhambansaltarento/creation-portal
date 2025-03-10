export interface ISessionContext { // TODO: remove any 'textbook' reference
  textBookUnitIdentifier?: any;
  collectionUnitIdentifier?: any;
  lastOpenedUnitChild?: any;
  lastOpenedUnitParent?: any;
  framework?: string;
  frameworkData?: any;
  channel?: string;
  board?: string;
  medium?: any;
  gradeLevel?: any;
  subject?: any;
  textbook?: string;
  collection?: string;
  topic?: string;
  questionType?: string;
  programId?: string;
  program?: string;
  currentRoles?: Array<string>;
  currentRoleIds?: Array<number>;
  bloomsLevel?: Array<any>;
  topicList?: Array<any>;
  onBoardSchool?: string;
  selectedSchoolForReview?: string;
  resourceIdentifier?: string;
  hierarchyObj?: any;
  textbookName?: any;
  collectionName?: any;
  collectionType?: any;
  collectionStatus?: any;
  currentOrgRole?: string;
  nominationDetails?: any;
  telemetryPageDetails?: any;
  questionSetEditorDetails?: any;
  targetCollectionFrameworksData?: any;
  targetCollectionPrimaryCategory?: any;
  targetCollectionMimetype?: any;
}

export interface IPagination {
  totalItems: number;
  currentPage: number;
  pageSize: number;
  totalPages: number;
  startPage: number;
  endPage: number;
  startIndex: number;
  endIndex: number;
  pages: Array<number>;
}
