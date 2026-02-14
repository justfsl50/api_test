#!/data/data/com.termux/files/usr/bin/bash

BASE="https://erptestbackend-production.up.railway.app"

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
GRAY='\033[0;90m'
WHITE='\033[1;37m'
NC='\033[0m' # No Color

# Function to call API
call_api() {
    local method=$1
    local path=$2
    local body=$3
    local uri="${BASE}${path}"
    
    if [ "$method" = "GET" ]; then
        curl -s -X GET "$uri" --connect-timeout 30
    else
        curl -s -X POST "$uri" \
            -H "Content-Type: application/json" \
            -d "$body" \
            --connect-timeout 120
    fi
}

# ========== HEALTH CHECK ==========
echo -e "\n${CYAN}=== Health Check ===${NC}"
health=$(call_api "GET" "/health" "")
if [ $? -eq 0 ]; then
    status=$(echo "$health" | jq -r '.status')
    uptime=$(echo "$health" | jq -r '.uptime')
    sessions=$(echo "$health" | jq -r '.activeSessions')
    echo -e "${GREEN}Status: $status | Uptime: ${uptime}s | Sessions: $sessions${NC}"
else
    echo -e "${RED}Error: Unable to reach server${NC}"
fi

# ========== LOGIN FLOW ==========
echo -e "\n${CYAN}=== Step 1: Get CAPTCHA ===${NC}"
read -p "Enter your roll number: " username
read -sp "Enter your password: " password
echo ""

captcha_body=$(jq -n \
    --arg u "$username" \
    --arg p "$password" \
    '{username: $u, password: $p}')

captcha_resp=$(call_api "POST" "/api/get-captcha" "$captcha_body")

if [ $? -ne 0 ]; then
    echo -e "${RED}Error: Failed to get CAPTCHA${NC}"
    exit 1
fi

SID=$(echo "$captcha_resp" | jq -r '.sessionId')
captcha_image=$(echo "$captcha_resp" | jq -r '.captchaImage')

echo -e "${GREEN}Session: $SID${NC}"

# Save CAPTCHA image
img_data=$(echo "$captcha_image" | sed 's/^data:image\/png;base64,//')
img_path="$HOME/captcha.png"
echo "$img_data" | base64 -d > "$img_path"
echo -e "${YELLOW}CAPTCHA saved to: $img_path${NC}"
echo -e "${YELLOW}Opening CAPTCHA with termux-open...${NC}"
termux-open "$img_path" 2>/dev/null || echo -e "${YELLOW}Please check $img_path manually${NC}"

logged_in=false

while [ "$logged_in" = false ]; do
    echo ""
    read -p "Type the CAPTCHA you see: " captcha
    
    echo -e "\n${CYAN}=== Step 2: Submit CAPTCHA ===${NC}"
    
    login_body=$(jq -n \
        --arg s "$SID" \
        --arg c "$captcha" \
        '{sessionId: $s, captcha: $c}')
    
    login_resp=$(call_api "POST" "/api/submit-captcha" "$login_body")
    
    success=$(echo "$login_resp" | jq -r '.success')
    
    if [ "$success" = "true" ]; then
        logged_in=true
        name=$(echo "$login_resp" | jq -r '.student.name')
        crn=$(echo "$login_resp" | jq -r '.student.crn')
        rollNo=$(echo "$login_resp" | jq -r '.student.rollNo')
        program=$(echo "$login_resp" | jq -r '.student.program')
        branch=$(echo "$login_resp" | jq -r '.student.branch')
        semester=$(echo "$login_resp" | jq -r '.student.semester')
        
        echo -e "\n${GREEN}========================================${NC}"
        echo -e "${GREEN}  LOGIN SUCCESSFUL${NC}"
        echo -e "${GREEN}========================================${NC}"
        echo -e "  Name:     $name"
        echo -e "  CRN:      $crn"
        echo -e "  Roll No:  $rollNo"
        echo -e "  Program:  $program"
        echo -e "  Branch:   $branch"
        echo -e "  Semester: $semester"
        echo -e "${GREEN}========================================${NC}\n"
    else
        echo -e "${RED}Login failed. Refreshing CAPTCHA...${NC}"
        
        refresh_body=$(jq -n --arg s "$SID" '{sessionId: $s}')
        refresh_resp=$(call_api "POST" "/api/refresh-captcha" "$refresh_body")
        
        if [ $? -eq 0 ]; then
            captcha_image=$(echo "$refresh_resp" | jq -r '.captchaImage')
            img_data=$(echo "$captcha_image" | sed 's/^data:image\/png;base64,//')
            echo "$img_data" | base64 -d > "$img_path"
            echo -e "${YELLOW}New CAPTCHA saved. Opening...${NC}"
            termux-open "$img_path" 2>/dev/null
        else
            echo -e "${RED}Refresh failed${NC}"
            exit 1
        fi
    fi
done

# ========== DATA ENDPOINTS ==========
body=$(jq -n --arg s "$SID" '{sessionId: $s}')
continue=true

while [ "$continue" = true ]; do
    echo -e "${CYAN}Choose an endpoint to test:${NC}"
    echo "  1) Profile"
    echo "  2) Dashboard"
    echo "  3) Overall Attendance"
    echo "  4) Subjects List"
    echo "  5) All Subjects with Attendance"
    echo "  6) Timetable"
    echo "  7) Last Visit"
    echo "  8) Subject-wise Attendance (pick one)"
    echo "  9) Today's Timetable + Attendance"
    echo "  0) Exit"
    read -p $'\nYour choice: ' choice
    
    case $choice in
        1)
            echo -e "\n${CYAN}=== Profile ===${NC}"
            r=$(call_api "POST" "/api/profile" "$body")
            echo -e "  Name:           $(echo "$r" | jq -r '.profile.name')"
            echo -e "  CRN:            $(echo "$r" | jq -r '.profile.crn')"
            echo -e "  DOB:            $(echo "$r" | jq -r '.profile.dob')"
            echo -e "  Email:          $(echo "$r" | jq -r '.profile.email')"
            echo -e "  Personal Email: $(echo "$r" | jq -r '.profile.personalEmail')"
            echo -e "  Phone:          $(echo "$r" | jq -r '.profile.phone')"
            echo -e "  Father:         $(echo "$r" | jq -r '.profile.fatherName')"
            echo -e "  Mother:         $(echo "$r" | jq -r '.profile.motherName')"
            echo -e "  Bank:           $(echo "$r" | jq -r '.profile.bank.bankName') ($(echo "$r" | jq -r '.profile.bank.ifsc'))"
            echo -e "  Aadhar:         $(echo "$r" | jq -r '.profile.documents.aadhar')"
            ;;
        2)
            echo -e "\n${CYAN}=== Dashboard ===${NC}"
            r=$(call_api "POST" "/api/dashboard" "$body")
            echo -e "  Name:     $(echo "$r" | jq -r '.dashboard.name')"
            echo -e "  CRN:      $(echo "$r" | jq -r '.dashboard.crn')"
            echo -e "  Roll No:  $(echo "$r" | jq -r '.dashboard.rollNo')"
            echo -e "  Program:  $(echo "$r" | jq -r '.dashboard.program')"
            echo -e "  Branch:   $(echo "$r" | jq -r '.dashboard.branch')"
            echo -e "  Section:  $(echo "$r" | jq -r '.dashboard.section')"
            echo -e "  Semester: $(echo "$r" | jq -r '.dashboard.semester')"
            ;;
        3)
            echo -e "\n${CYAN}=== Overall Attendance ===${NC}"
            r=$(call_api "POST" "/api/attendance" "$body")
            echo -e "  Total:    ${WHITE}$(echo "$r" | jq -r '.attendance.totalClasses')${NC}"
            echo -e "  Present:  ${GREEN}$(echo "$r" | jq -r '.attendance.classesAttended')${NC}"
            echo -e "  Absent:   ${RED}$(echo "$r" | jq -r '.attendance.classesAbsent')${NC}"
            echo -e "  Percent:  ${YELLOW}$(echo "$r" | jq -r '.attendance.percentage')%${NC}"
            ;;
        4)
            echo -e "\n${CYAN}=== Subjects ===${NC}"
            r=$(call_api "POST" "/api/subjects" "$body")
            echo "$r" | jq -r '.subjects[] | "  [\(.id)] \(.code) - \(.name)"'
            ;;
        5)
            echo -e "\n${CYAN}=== All Subjects Attendance ===${NC}"
            echo -e "${GRAY}(This may take a moment...)${NC}"
            r=$(call_api "POST" "/api/attendance/all" "$body")
            attended=$(echo "$r" | jq -r '.overall.classesAttended')
            total=$(echo "$r" | jq -r '.overall.totalClasses')
            percent=$(echo "$r" | jq -r '.overall.percentage')
            echo -e "\n  ${YELLOW}OVERALL: $attended/$total ($percent%)${NC}\n"
            
            echo "$r" | jq -r '.subjects[] | "\(.code)|\(.classesAttended)|\(.totalClasses)|\(.percentage)|\(.name)"' | while IFS='|' read -r code att tot pct name; do
                if (( $(echo "$pct >= 75" | bc -l) )); then
                    color=$GREEN
                elif (( $(echo "$pct >= 50" | bc -l) )); then
                    color=$YELLOW
                else
                    color=$RED
                fi
                printf "  ${color}%-12s %s/%-3s\t%s%%\t%s${NC}\n" "$code" "$att" "$tot" "$pct" "$name"
            done
            ;;
        6)
            echo -e "\n${CYAN}=== Timetable ===${NC}"
            r=$(call_api "POST" "/api/timetable" "$body")
            echo "$r" | jq -c '.timetable[]' | while read -r day_obj; do
                day=$(echo "$day_obj" | jq -r '.day')
                echo -e "\n  ${YELLOW}$day:${NC}"
                echo "$day_obj" | jq -c '.periods[]' | while read -r period; do
                    type=$(echo "$period" | jq -r '.type')
                    time=$(echo "$period" | jq -r '.time')
                    
                    if [ "$type" = "lunch" ]; then
                        echo -e "    ${GRAY}$time -- LUNCH${NC}"
                    elif [ "$type" = "free" ]; then
                        echo -e "    ${GRAY}$time -- Free${NC}"
                    else
                        subject=$(echo "$period" | jq -r '.subject')
                        code=$(echo "$period" | jq -r '.code')
                        classType=$(echo "$period" | jq -r '.classType')
                        suspended=$(echo "$period" | jq -r '.isSuspended')
                        sus=""
                        [ "$suspended" = "true" ] && sus=" [SUSPENDED]"
                        echo -e "    ${WHITE}$time -- $subject ($code) [$classType]$sus${NC}"
                    fi
                done
            done
            ;;
        7)
            echo -e "\n${CYAN}=== Last Visit ===${NC}"
            r=$(call_api "POST" "/api/last-visit" "$body")
            greeting=$(echo "$r" | jq -r '.lastVisit.greeting')
            name=$(echo "$r" | jq -r '.lastVisit.name')
            last_time=$(echo "$r" | jq -r '.lastVisit.lastVisitTime')
            echo -e "  $greeting, $name"
            echo -e "  Last visit: $last_time"
            ;;
        8)
            echo -e "\n${CYAN}=== Subject-wise Attendance ===${NC}"
            echo -e "${GRAY}First, fetching subjects...${NC}"
            r=$(call_api "POST" "/api/subjects" "$body")
            echo "$r" | jq -r '.subjects[] | "  [\(.id)] \(.code) - \(.name)"'
            read -p $'\nEnter subject ID: ' subId
            
            sub_body=$(jq -n --arg s "$SID" --arg id "$subId" '{sessionId: $s, subjectId: $id}')
            ar=$(call_api "POST" "/api/attendance/subject" "$sub_body")
            echo -e "  Total:   $(echo "$ar" | jq -r '.attendance.totalClasses')"
            echo -e "  Present: $(echo "$ar" | jq -r '.attendance.classesAttended')"
            echo -e "  Absent:  $(echo "$ar" | jq -r '.attendance.classesAbsent')"
            echo -e "  Percent: $(echo "$ar" | jq -r '.attendance.percentage')%"
            ;;
        9)
            echo -e "\n${CYAN}=== Today's Timetable + Attendance ===${NC}"
            r=$(call_api "POST" "/api/today" "$body")
            day=$(echo "$r" | jq -r '.day')
            date=$(echo "$r" | jq -r '.date')
            message=$(echo "$r" | jq -r '.message')
            echo -e "  ${YELLOW}Day: $day  |  Date: $date${NC}"
            [ "$message" != "null" ] && echo -e "  ${GRAY}$message${NC}"
            echo ""
            
            echo "$r" | jq -c '.periods[]' | while read -r period; do
                type=$(echo "$period" | jq -r '.type')
                time=$(echo "$period" | jq -r '.time')
                
                if [ "$type" = "lunch" ]; then
                    echo -e "    ${GRAY}$time -- LUNCH${NC}"
                elif [ "$type" = "free" ]; then
                    echo -e "    ${GRAY}$time -- Free${NC}"
                else
                    subject=$(echo "$period" | jq -r '.subject')
                    code=$(echo "$period" | jq -r '.code')
                    classType=$(echo "$period" | jq -r '.classType')
                    status=$(echo "$period" | jq -r '.attendanceStatus')
                    suspended=$(echo "$period" | jq -r '.isSuspended')
                    
                    case $status in
                        present) color=$GREEN ;;
                        absent) color=$RED ;;
                        suspended) color=$YELLOW ;;
                        *) color=$WHITE ;;
                    esac
                    
                    tag=$(echo "$status" | tr '[:lower:]' '[:upper:]')
                    sus=""
                    [ "$suspended" = "true" ] && sus=" [SUSPENDED]"
                    echo -e "    ${color}$time -- $subject ($code) [$classType] [$tag]$sus${NC}"
                fi
            done
            
            total=$(echo "$r" | jq -r '.summary.totalPeriods')
            present=$(echo "$r" | jq -r '.summary.present')
            absent=$(echo "$r" | jq -r '.summary.absent')
            notMarked=$(echo "$r" | jq -r '.summary.notMarked')
            echo -e "\n    ${CYAN}Summary: $total classes | Present: $present | Absent: $absent | Not Marked: $notMarked${NC}"
            ;;
        0)
            echo -e "\n${CYAN}Closing session...${NC}"
            call_api "POST" "/api/close-session" "$body" > /dev/null 2>&1
            continue=false
            ;;
        *)
            echo -e "${RED}Invalid choice${NC}"
            ;;
    esac
    
    [ "$continue" = true ] && echo ""
done

echo -e "\n${CYAN}Done!${NC}"
