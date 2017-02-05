/**
 * @file 基于Angular 1.x的数控件
 * @author wlf-21@163.com
 */

(function () {
    let module = angular.module('angularTree', []);
    module.directive('uiTree', ['$timeout', function ($timeout) {
        return {
            restrict: 'AE',
            template: `
                <ul class="angular-tree">
                    <li ng-repeat="row in rowData | filter:{visible:true} track by row.branch._id" 
                   ng-class="{'active': row.branch.selected, 'tree-leaf': row.isLeaf}"
                    class="angular-tree-row level-{{row.level}}">
                        <a ng-click="clickBranchHandler(row.branch)">
                            <i ng-class="row.treeIcon" 
                            ng-click="row.branch.expanded = !row.branch.expanded" 
                            class="indented tree-icon"></i>
                            <span class="indented tree-label">{{row.label}}</span>
                        </a>
                    </li>
                </ul>`,
            replace: true,
            scope: {
                treeData: '=',
                treeControl: '=',
                onSelect: '&',
                initialSelection: '@'
            },
            link: function (scope, element, attrs) {
                let selectedBranch = null;
                let expandLevel = parseInt(attrs.expandLevel, 10);
                if (!attrs.iconExpand) {
                    attrs.iconExpand = 'fa fa-plus';
                }
                if (!attrs.iconCollapse) {
                    attrs.iconCollapse = 'fa fa-minus';
                }
                if (!attrs.iconLeaf) {
                    attrs.iconLeaf = 'fa fa-file-archive-o';
                }
                if (!attrs.expandLevel) {
                    attrs.expandLevel = '3';
                }
                if (!scope.treeData || !angular.isArray(scope.treeData)) {
                    console.log('数据没有定义或不正确');
                    return;
                }

                function hasChildren(branch) {
                    return branch.children && angular.isArray(branch.children) && branch.children.length
                }

                function forEachCurrData(callback) {
                    let doEach = function (branch, level) {
                        callback(branch, level);
                        if (hasChildren(branch)) {
                            angular.forEach(branch.children, function (item) {
                                doEach(item, level + 1);
                            });
                        }
                    };
                    angular.forEach(scope.currData, function (item) {
                        doEach(item, 1);
                    })
                }

                function selectBranch(branch) {
                    if (!branch) {
                        if (selectedBranch !== null) {
                            selectedBranch.selected = false;
                        }
                        selectedBranch = null;
                        return;
                    }

                    if (!selectedBranch || branch.id !== selectedBranch.id) {
                        if (selectedBranch !== null) {
                            selectedBranch.selected = false;
                        }
                        branch.selected = true;
                        selectedBranch = branch;
                        expandAllParents(branch);
                        if (branch.onSelect) {
                            return $timeout(function () {
                                return branch.onSelect(branch);
                            });
                        } else {
                            if (scope.onSelect) {
                                return $timeout(function () {
                                    return scope.onSelect({
                                        branch: branch
                                    });
                                });
                            }
                        }
                    }
                }

                function getParent(branch) {
                    let parent = void 0;

                    if (branch._parentId) {
                        forEachCurrData(function (item) {
                            if (item._id === branch._parentId) {
                                return parent = item;
                            }
                        });
                    }
                    return parent;
                }

                function expandAllParents(currBranch) {
                    let doEach = function (branch, callback) {
                        let parent = getParent(branch);
                        if (parent) {
                            callback(parent);
                            doEach(parent, callback);
                        }
                    };
                    doEach(currBranch, function (branch) {
                        branch.expanded = true;
                    });
                }

                function watchOriginalDataHandler() {
                    scope.currData = [];

                    angular.forEach(scope.treeData, function (item) {
                        item && scope.currData.push(JSON.parse(JSON.stringify(item)));
                    });

                    forEachCurrData(function (branch, level) {
                        branch._level = level;
                        branch.expanded = branch._level <= expandLevel;
                    });
                    watchCurrDataHandler();
                }

                function watchCurrDataHandler() {
                    forEachCurrData(function (branch) {
                        if (!branch._id) {
                            branch._id = Math.random().toString(16).substring(2);
                        }

                        if (!branch.children) {
                            branch.children = [];
                        }

                        if (hasChildren(branch)) {
                            angular.forEach(branch.children, function (item) {
                                item._parentId = branch._id;
                            })
                        }
                    });

                    function addBranchToList(level, branch, visible) {
                        let treeIcon;

                        if (!branch.expanded) {
                            branch.expanded = false;
                        }

                        if (!branch.noLeaf && !hasChildren(branch)) {
                            treeIcon = attrs.iconLeaf;
                            branch.isLeaf = true;
                        } else {
                            branch.isLeaf = false;
                            if (branch.expanded) {
                                treeIcon = attrs.iconCollapse;
                            } else {
                                treeIcon = attrs.iconExpand;
                            }
                        }

                        scope.rowData.push({
                            level: level,
                            branch: branch,
                            label: branch.label,
                            isLeaf: branch.isLeaf,
                            treeIcon: treeIcon,
                            visible: visible
                        });

                        if (hasChildren(branch)) {
                            angular.forEach(branch.children, function (item) {
                                let isVisible = visible && branch.expanded;
                                addBranchToList(level + 1, item, isVisible);
                            })
                        }
                    }

                    scope.rowData = [];
                    angular.forEach(scope.currData, function (item) {
                        addBranchToList(1, item, true)
                    });
                }

                scope.clickBranchHandler = function (branch) {
                    if (!selectedBranch || selectedBranch.id !== branch.id) {
                        selectBranch(branch);
                    }
                };

                scope.currData = [];
                scope.$watch('treeData', watchOriginalDataHandler, true);
                scope.$watch('currData', watchCurrDataHandler, true);

                if (scope.treeControl && angular.isObject(scope.treeControl)) {
                    let tree = scope.treeControl || {};

                    /**
                     * 展开所有节点
                     */
                    tree.expandAll = function () {
                        return forEachCurrData(function (b) {
                            return b.expanded = true;
                        });
                    };

                    /**
                     * 折叠所有节点
                     */
                    tree.collapseAll = function () {
                        return forEachCurrData(function (b) {
                            return b.expanded = false;
                        });
                    };

                    /**
                     * 获取第一个节点
                     */
                    tree.getFirstBranch = function () {
                        let n = scope.currData.length;
                        if (n > 0) {
                            return scope.currData[0];
                        }
                        else {
                            return null;
                        }
                    };

                    /**
                     * 选择第一个节点
                     */
                    tree.selectFirstBranch = function () {
                        let firstBranch = tree.getFirstBranch();
                        return tree.selectBranch(firstBranch);
                    };

                    /**
                     * 获取已选择的节点
                     */
                    tree.getSelectedBranch = function () {
                        return selectedBranch;
                    };

                    /**
                     * 获取父级节点
                     */
                    tree.getParentBranch = function (branch) {
                        if (!branch) {
                            branch = tree.getSelectedBranch();
                        }
                        return getParent(branch);
                    };

                    /**
                     * 选择节点
                     *
                     * @param {Object} branch 节点数据
                     */
                    tree.selectBranch = function (branch) {
                        selectBranch(branch);
                    };

                    /**
                     * 选择父级节点
                     *
                     * @param {Object} branch 节点数据
                     */
                    tree.selectParentBranch = function (branch) {
                        if (!branch) {
                            branch = tree.getSelectedBranch();
                        }
                        if (branch) {
                            let parentBranch = tree.getParentBranch(branch);
                            if (parentBranch !== null) {
                                tree.selectBranch(parentBranch);
                            }
                        }
                    };

                    /**
                     * 添加节点
                     *
                     * @param parent 父级节点
                     * @param newBranch 新的节点数据
                     */
                    tree.addBranch = function (parent, newBranch) {
                        if (parent !== null) {
                            parent.children.push(newBranch);
                            parent.expanded = true;
                        }
                        else {
                            scope.currData.push(newBranch);
                        }
                    };

                    /**
                     * 添加根节点
                     *
                     * @param newBranch 新的节点数据
                     */
                    tree.addRootBranch = function (newBranch) {
                        tree.addBranch(null, newBranch);
                    };

                    /**
                     * 展开当前节点
                     */
                    tree.expandBranch = function () {
                        let selectedBranch = tree.getSelectedBranch();
                        if (selectedBranch) {
                            if (hasChildren(selectedBranch)) {
                                selectedBranch.expanded = true;
                            }
                            else {
                                console.log('没有子节点');
                            }
                        }
                        else {
                            console.log('请选择节点');
                        }
                    };

                    /**
                     * 展开当前节点
                     */
                    tree.collapseBranch = function () {
                        let selectedBranch = tree.getSelectedBranch();

                        if (selectedBranch) {
                            if (hasChildren(selectedBranch)) {
                                selectedBranch.expanded = false;
                            }
                            else {
                                console.log('没有子节点');
                            }
                        }
                        else {
                            console.log('请选择节点');
                        }
                    };

                    /**
                     * 获取兄弟节点
                     * @param {Object} branch 当前节点
                     * @return {Array} 所有兄弟节点
                     */
                    tree.getSiblings = function (branch) {
                        let siblings;
                        let selectedBranch;

                        if (!branch) {
                            selectedBranch = tree.getSelectedBranch();
                        }
                        else {
                            selectedBranch = branch;
                        }

                        let parent = tree.getParentBranch(selectedBranch);
                        if (parent) {
                            siblings = parent.children;
                        }
                        else {
                            siblings = scope.currData;
                        }
                        return siblings;
                    };

                    /**
                     * 获取下一个兄弟节点
                     *
                     * @param {Object} branch 当前节点
                     * @return {*}
                     */
                    tree.getNextSibling = function (branch) {
                        if (!branch) {
                            branch = tree.getSelectedBranch();
                        }
                        if (branch) {
                            let siblings = tree.getSiblings(branch);
                            let n = siblings.length;
                            let i = siblings.indexOf(branch);
                            if (i < n) {
                                return siblings[i + 1] || null;
                            }
                            else {
                                return null;
                            }
                        }
                    };

                    /**
                     * 获取上一个兄弟节点
                     *
                     * @param {Object} branch 当前节点
                     * @return {*}
                     */
                    tree.getPrevSibling = function (branch) {
                        if (!branch) {
                            branch = tree.getSelectedBranch();
                        }
                        let siblings = tree.getSiblings(branch);
                        let i = siblings.indexOf(branch);
                        if (i > 0) {
                            return siblings[i - 1];
                        }
                    };

                    /**
                     * 选择下一个兄弟节点
                     *
                     * @param {Object} branch 当前节点
                     */
                    tree.selectNextSibling = function (branch) {
                        if (!branch) {
                            branch = tree.getSelectedBranch();
                        }
                        if (branch) {
                            let nextSibling = tree.getNextSibling(branch);
                            if (nextSibling) {
                                tree.selectBranch(nextSibling);
                            }
                        }
                    };

                    /**
                     * 选择上一个兄弟节点
                     *
                     * @param {Object} branch 当前节点
                     */
                    tree.selectPrevSibling = function (branch) {
                        if (!branch) {
                            branch = tree.getSelectedBranch();
                        }
                        if (branch) {
                            let prevSibling = tree.getPrevSibling(branch);
                            if (prevSibling) {
                                tree.selectBranch(prevSibling);
                            }
                        }
                    };

                    /**
                     * 获取第一个字节点
                     * @param branch 当前节点
                     * @returns {Object} 第一个字节点
                     */
                    tree.getFirstChild = function (branch) {
                        if (!branch) {
                            branch = tree.getSelectedBranch();
                        }
                        if (branch) {
                            let child = branch.children;
                            if (child && child.length) {
                                return branch.children[0];
                            }
                        }
                    };

                    /**
                     * 获取最近的祖先兄弟
                     * @param branch 当前节点
                     * @returns {*}
                     */
                    tree.getClosestAncestorNextSibling = function (branch) {
                        let nextSibling = tree.getNextSibling(branch);
                        if (nextSibling) {
                            return nextSibling;
                        }
                        else {
                            let parentBranch = tree.getParentBranch(branch);
                            if (parentBranch) {
                                return tree.getClosestAncestorNextSibling(parentBranch);
                            }
                            else {
                                return null;
                            }
                        }
                    };

                    /**
                     * 获取下一个节点
                     * @param {Object} branch 当前节点
                     * @return {Object} 节点数据
                     */
                    tree.getNextBranch = function (branch) {
                        if (!branch) {
                            branch = tree.getSelectedBranch();
                        }
                        if (branch) {
                            let firstChild = tree.getFirstChild(branch);
                            if (firstChild) {
                                return firstChild;
                            }
                            else {
                                return tree.getClosestAncestorNextSibling(branch);
                            }
                        }

                    };

                    /**
                     * 选择下一个节点
                     *
                     * @param {Object} branch 当前节点数据
                     */
                    tree.selectNextBranch = function (branch) {
                        if (!branch) {
                            branch = tree.getSelectedBranch();
                        }
                        if (branch) {
                            let next = tree.getNextBranch(branch);
                            if (next) {
                                tree.selectBranch(next);
                            }
                        }
                    };

                    tree.lastDescendant = function (branch) {
                        if (!branch) {
                            return;
                        }

                        let length = branch.children.length;
                        if (length === 0) {
                            return branch;
                        }
                        else {
                            let lastChild = branch.children[length - 1];
                            return tree.lastDescendant(lastChild);
                        }
                    };

                    /**
                     * 获取上一个节点
                     * @param {Object} branch 当前节点
                     * @return {Object} 节点数据
                     */
                    tree.getPrevBranch = function (branch) {
                        if (!branch) {
                            branch = tree.getSelectedBranch();
                        }

                        if (branch) {
                            let prevSibling = tree.getPrevSibling(branch);
                            if (prevSibling) {
                                return tree.lastDescendant(prevSibling);
                            } else {
                                return tree.getParentBranch(branch);
                            }
                        }
                    };

                    /**
                     * 选择下一个节点
                     *
                     * @param {Object} branch 当前节点数据
                     */
                    tree.selectPrevBranch = function (branch) {
                        if (!branch) {
                            branch = tree.getSelectedBranch();
                        }

                        if (branch) {
                            let prevBranch = tree.getPrevBranch(branch);
                            if (prevBranch) {
                                return tree.selectBranch(prevBranch);
                            }
                        }
                    };

                }
            }
        };
    }]);

}).call(window);
